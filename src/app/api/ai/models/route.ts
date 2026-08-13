/**
 * @module api/ai/models
 * @description Next.js API route for dynamic AI model discovery.
 * GET /api/ai/models?provider=openai — returns available models for the given provider.
 * Reads the API key from the `x-api-key` header or falls back to environment variables.
 * Requires authentication via Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ProviderName } from '@/lib/ai/provider-interface';
import { discoverModels } from '@/lib/ai/model-discovery';
import { getProviderRegistry } from '@/lib/ai/provider-registry';
import { withAuth } from '@/lib/security/with-auth';
import { logger } from '@/lib/logging/logger';

/** Maps provider names to their expected environment variable keys. */
const ENV_KEY_MAP: Record<ProviderName, string[]> = {
  openai: ['AI_API_KEY', 'OPENAI_API_KEY'],
  anthropic: ['ANTHROPIC_API_KEY'],
  gemini: ['GEMINI_API_KEY', 'GOOGLE_AI_API_KEY'],
  mistral: ['MISTRAL_API_KEY'],
};

/** Valid provider names for request validation. */
const VALID_PROVIDERS: ProviderName[] = ['openai', 'anthropic', 'gemini', 'mistral'];

/**
 * Resolves the API key for a provider.
 * Priority: `x-api-key` header → environment variables.
 */
async function resolveApiKey(request: NextRequest, provider: ProviderName, userId: string): Promise<string | null> {
  // 1. Check header
  const headerKey = request.headers.get('x-api-key');
  if (headerKey) return headerKey;

  // 2. Fall back to DB
  const { prisma } = await import('@/lib/prisma');
  const dbKey = await prisma.aiSettings.findUnique({
    where: { userId },
  });
  if (dbKey?.apiKey && dbKey.provider === provider) {
    const { decryptApiKey } = await import('@/lib/ai/api-key-encryption');
    return await decryptApiKey(dbKey.apiKey, userId);
  }

  // 3. Fall back to env vars
  const envKeys = ENV_KEY_MAP[provider];
  for (const envName of envKeys) {
    const value = process.env[envName];
    if (value) return value;
  }

  return null;
}

/**
 * GET /api/ai/models?provider=<name>
 *
 * Query parameters:
 *   - `provider` (required) — one of: openai, anthropic, gemini, mistral
 *   - `refresh` (optional) — set to "true" to bypass the 5-minute cache
 *
 * Headers:
 *   - `x-api-key` (optional) — API key override; falls back to env vars
 *
 * Response: `{ provider, models: AIModel[] }`
 */
async function handlerGet(request: NextRequest, { userId }: { userId: string }) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') as ProviderName | null;

  // Validate provider parameter
  if (!provider) {
    return NextResponse.json(
      { error: 'Missing required query parameter: provider' },
      { status: 400 }
    );
  }

  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json(
      {
        error: `Invalid provider "${provider}". Valid providers: ${VALID_PROVIDERS.join(', ')}`,
      },
      { status: 400 }
    );
  }

  // Verify the provider is registered
  const registry = getProviderRegistry();
  if (!registry.has(provider)) {
    return NextResponse.json(
      { error: `Provider "${provider}" is not available.` },
      { status: 404 }
    );
  }

  // Resolve API key
  const apiKey = await resolveApiKey(request, provider, userId);
  if (!apiKey) {
    return NextResponse.json(
      {
        error: `No API key found for provider "${provider}". Provide via x-api-key header or configure environment variables.`,
      },
      { status: 401 }
    );
  }

  const forceRefresh = searchParams.get('refresh') === 'true';

  try {
    const models = await discoverModels(provider, apiKey, forceRefresh);
    return NextResponse.json({ provider, models });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[API /ai/models] Error listing models for ${provider}`, error, { userId, provider });
    return NextResponse.json(
      { error: `Failed to list models for ${provider}: ${message}` },
      { status: 502 }
    );
  }
}

export const GET = withAuth(handlerGet);