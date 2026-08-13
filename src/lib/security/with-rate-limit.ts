/**
 * Helmdash — Rate Limit Wrapper
 *
 * Composable rate-limiting for API routes using Upstash Redis.
 * Falls back to in-memory store in dev/test when Upstash is not configured.
 *
 * Usage:
 * ```ts
 * import { withAuth } from '@/lib/security/with-auth';
 * import { withRateLimit } from '@/lib/security/with-rate-limit';
 *
 * export const POST = withAuth(withRateLimit(async (req, { userId }) => {
 *   // protected + rate limited
 * }, { rpm: 30 }));
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  /** Max requests per minute per user/IP */
  rpm?: number;
  /** Optional key suffix for scoping (e.g. route name) */
  scope?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

// ── In-memory fallback (dev/test only) ──────────────────────
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(key: string, rpm: number): RateLimitResult {
  const now = Date.now();
  const windowMs = 60_000;

  const entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: rpm - 1, reset: now + windowMs };
  }

  entry.count += 1;
  if (entry.count > rpm) {
    return { allowed: false, remaining: 0, reset: entry.resetAt };
  }

  return { allowed: true, remaining: rpm - entry.count, reset: entry.resetAt };
}

// ── Upstash Redis (production) ──────────────────────────────
export async function upstashRateLimit(key: string, rpm: number): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || !url.startsWith('https://')) {
    if (url && !url.startsWith('https://')) {
      console.warn('[withRateLimit] UPSTASH_REDIS_REST_URL must start with https://, falling back to memory store');
    }
    return memoryRateLimit(key, rpm);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    // Use a simple INCR + EXPIRE approach via Upstash REST API
    // See: https://upstash.com/docs/redis/features/ratelimiting
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        ['eval', `
          local key = KEYS[1]
          local limit = tonumber(ARGV[1])
          local window = tonumber(ARGV[2])
          local current = redis.call('INCR', key)
          if current == 1 then
            redis.call('EXPIRE', key, window)
          end
          local ttl = redis.call('TTL', key)
          if current <= limit then
            return {1, limit - current, ttl}
          else
            return {0, 0, ttl}
          end
        `, 1, key, rpm, 60]
      ),
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[withRateLimit] Upstash error:', response.status);
      return memoryRateLimit(key, rpm);
    }

    const json = await response.json();
    const data = json.result;
    if (Array.isArray(data) && data.length >= 3) {
      return {
        allowed: data[0] === 1,
        remaining: data[1],
        reset: Math.floor(Date.now() / 1000) + data[2],
      };
    }

    return memoryRateLimit(key, rpm);
  } catch (error) {
    console.error('[withRateLimit] Upstash request failed:', error);
    return memoryRateLimit(key, rpm);
  }
}

// ── Public wrapper ─────────────────────────────────────────
export function withRateLimit<T = unknown>(
  handler: (req: NextRequest, context: { userId: string; params: T }) => Promise<NextResponse | Response>,
  config: RateLimitConfig = {},
) {
  const rpm = config.rpm ?? 60;
  const scope = config.scope ?? 'default';

  return async (req: NextRequest, context: { userId: string; params: T }) => {
    const key = `helmdash:ratelimit:${scope}:${context.userId}`;

    const result = await upstashRateLimit(key, rpm);

    const headers = new Headers();
    headers.set('X-RateLimit-Limit', String(rpm));
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', String(result.reset));

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers },
      );
    }

    const response = await handler(req, context);

    // Add rate-limit headers without consuming the body (to preserve streams)
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Limit', String(rpm));
    newHeaders.set('X-RateLimit-Remaining', String(result.remaining));
    newHeaders.set('X-RateLimit-Reset', String(result.reset));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    }) as NextResponse;
  };
}