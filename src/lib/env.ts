/**
 * Helmdash — Environment Variable Validation
 *
 * Centralised Zod-based validation of all required environment variables.
 * Parse at startup — fail fast with a clear message.
 * Import `env` instead of using `process.env.X!` throughout the codebase.
 */

import { z } from 'zod';

const envSchema = z.object({
  // ── Database ──────────────────────────────────────────────
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  // ── Supabase ──────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // ── AI Providers (at least one required) ──────────────────
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  AI_API_KEY: z.string().optional(),

  // ── Encryption ────────────────────────────────────────────
  MASTER_ENCRYPTION_KEY: z.string().min(1, 'MASTER_ENCRYPTION_KEY is required for API key encryption at rest'),

  // ── Rate Limiting ─────────────────────────────────────────
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // ── Stripe ────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_PRICE_FOUNDER_MONTHLY: z.string().optional(),
  STRIPE_PRICE_CORE_MONTHLY: z.string().optional(),
  STRIPE_PRICE_COMPLETE_MONTHLY: z.string().optional(),

  // ── Composio ──────────────────────────────────────────────
  COMPOSIO_API_KEY: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),

  // ── Email ─────────────────────────────────────────────────
  RESEND_API_KEY: z.string().optional(),

  // ── Observability ─────────────────────────────────────────
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),

  // ── App Config ────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url(),
  CRON_SECRET: z.string().min(1, 'CRON_SECRET is required for cron job security'),
  HERMES_API_KEY: z.string().optional(),

  // ── Feature Flags ─────────────────────────────────────────
  ENABLE_SUB_AGENTS: z.string().optional(),
  ENABLE_STRIPE_SYNC: z.string().optional(),
  ENABLE_WEB_SEARCH: z.string().optional(),
  ENABLE_MEMORY_GRAPH: z.string().optional(),

  // ── Environment ───────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables at boot.
 * Throws a clear ZodError if any required var is missing.
 */
function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    }
    console.error('\n💡 Check your .env.local file and ensure all required vars are set.');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    // In dev/test, return partial defaults to avoid crashing on every restart
    // Cast through unknown since result.data may be undefined on failure
    return (result.data ?? {}) as Env;
  }
  return result.data;
}

export const env = parseEnv();

/**
 * Helper to check if at least one AI provider key is configured.
 */
export function hasAiProvider(): boolean {
  return !!(env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY || env.GOOGLE_AI_API_KEY || env.GEMINI_API_KEY || env.MISTRAL_API_KEY || env.AI_API_KEY);
}