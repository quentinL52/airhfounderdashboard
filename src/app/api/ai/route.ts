/**
 * @module api/ai
 * @description Main AI chat route with multi-provider support.
 * Supports OpenAI (default), Anthropic, Gemini, and Mistral via the provider registry.
 * Requires authentication via Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ChatMessage, ChatOptions, ProviderName } from '@/lib/ai/provider-interface';
import { getProviderRegistry } from '@/lib/ai/provider-registry';
import { withAuth } from '@/lib/security/with-auth';
import { logger } from '@/lib/logging/logger';

/** Default provider when none is specified (backward compatibility). */
const DEFAULT_PROVIDER: ProviderName = 'openai';

/** Default model per provider for legacy action-based requests. */
const DEFAULT_MODELS: Record<ProviderName, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  gemini: 'gemini-2.5-flash',
  mistral: 'mistral-large-latest',
};

/** Maps provider names to their expected environment variable keys. */
const ENV_KEY_MAP: Record<ProviderName, string[]> = {
  openai: ['AI_API_KEY', 'OPENAI_API_KEY'],
  anthropic: ['ANTHROPIC_API_KEY'],
  gemini: ['GEMINI_API_KEY', 'GOOGLE_AI_API_KEY'],
  mistral: ['MISTRAL_API_KEY'],
};

/**
 * Resolves the API key for a provider from environment variables.
 * Checks all known env var names for the given provider.
 */
async function resolveApiKey(provider: ProviderName, userId: string): Promise<string | null> {
  // 1. Fall back to DB
  const { prisma } = await import('@/lib/prisma');
  const dbKey = await prisma.aiSettings.findUnique({
    where: { userId },
  });
  if (dbKey?.apiKey && dbKey.provider === provider) {
    const { decryptApiKey } = await import('@/lib/ai/api-key-encryption');
    return await decryptApiKey(dbKey.apiKey, userId);
  }

  // 2. Fall back to env vars
  const envKeys = ENV_KEY_MAP[provider];
  for (const envName of envKeys) {
    const value = process.env[envName];
    if (value) return value;
  }
  return null;
}

/**
 * POST /api/ai
 *
 * Supports two request modes:
 *
 * **1. Legacy action-based mode** (backward compatible):
 * ```json
 * { "action": "weekly-report", "data": { ... } }
 * ```
 * Uses OpenAI/gpt-4o by default. Optionally accepts `provider` and `model`.
 *
 * **2. Direct chat mode** (new multi-provider):
 * ```json
 * {
 *   "provider": "anthropic",
 *   "model": "claude-sonnet-4-20250514",
 *   "messages": [{ "role": "user", "content": "Hello" }],
 *   "options": { "temperature": 0.7, "maxTokens": 1024 }
 * }
 * ```
 */
import { aiGateway, QuotaExceededError } from '@/modules/shared/infrastructure/ai/ai-gateway';

/**
 * POST /api/ai
 */
async function handler(request: NextRequest, { userId }: { userId: string }) {
  try {
    const body = await request.json();
    const {
      action,
      data,
      provider: requestedProvider,
      model: requestedModel,
      messages,
      options,
    } = body;

    const provider: ProviderName = requestedProvider ?? DEFAULT_PROVIDER;
    const model: string = requestedModel ?? DEFAULT_MODELS[provider];

    // --- Direct chat mode ---
    if (messages && Array.isArray(messages)) {
      const chatMessages: ChatMessage[] = messages;

      const response = await aiGateway.chat(userId, chatMessages, {
        provider,
        model,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      });

      return NextResponse.json({
        result: response.content,
        model: response.model,
        provider: response.provider,
        usage: response.usage,
      });
    }

    // --- Legacy action-based mode ---
    if (!action) {
      return NextResponse.json(
        { error: 'Request must include either "messages" (chat mode) or "action" (legacy mode).' },
        { status: 400 }
      );
    }

    let actionMessages: ChatMessage[];

    switch (action) {
      case 'weekly-report':
        actionMessages = buildWeeklyReportMessages(data);
        break;
      case 'follow-up':
        actionMessages = buildFollowUpMessages(data);
        break;
      case 'routine-analysis':
        actionMessages = buildRoutineAnalysisMessages(data);
        break;
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    const response = await aiGateway.chat(userId, actionMessages, {
      provider,
      model,
    });

    return NextResponse.json({ result: response.content });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    logger.error('[API /ai] Error', error, { userId });
    const message = error instanceof Error ? error.message : 'AI generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);

// ---------------------------------------------------------------------------
// Legacy action handlers (refactored to use the provider abstraction)
// ---------------------------------------------------------------------------

/**
 * Executes a legacy action by routing messages through the provider adapter.
 */
async function handleLegacyAction(
  provider: ReturnType<ReturnType<typeof getProviderRegistry>['get']>,
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const response = await provider.chat(messages, model);
  return response.content;
}

/** Builds chat messages for the weekly report action. */
function buildWeeklyReportMessages(data: {
  cashAvailable: number;
  objectives: { title: string; progress: number; status: string }[];
  hypotheses: { statement: string; status: string; actualResult?: string }[];
  journalEntries: { date: string; mood: number }[];
}): ChatMessage[] {
  const prompt = `
You are an elite startup coach for a solo founder.
Analyze the following data from their "Founder Operating System":

**Context:**
- **Data Date**: ${new Date().toLocaleDateString()}
- **Runway**: ${data.cashAvailable} cash available (check burn rate context yourself if provided).
- **Objectives (OKRs)**: ${JSON.stringify(data.objectives)}
- **Hypotheses**: ${JSON.stringify(data.hypotheses)}
- **Recent Journal Moods**: ${JSON.stringify(data.journalEntries)}

**Your Goal:**
Write a concise, high-impact "Weekly Coach Report".
1. **Assessment**: Briefly assess their current state (Focus, Validation, Health).
2. **One Big Observation**: Connect dots between their mood, progress, and hypotheses.
3. **Actionable Advice**: Give 1 specific, tactical recommendation for next week.

**Tone:** Encouraging but radically candid. Concise. Use Markdown.
`;

  return [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: prompt },
  ];
}

/** Builds chat messages for the follow-up email action. */
function buildFollowUpMessages(data: {
  name: string;
  role?: string;
  company?: string;
  lastContactDate: string;
  status: string;
  notes?: string;
}): ChatMessage[] {
  const prompt = `
Context: I am a founder. I last spoke to ${data.name} (${data.role || 'Partner'} at ${data.company || 'Unknown'}) on ${data.lastContactDate}.
Status: ${data.status}.
Notes: ${data.notes || 'No notes'}.

Task: Draft a short, personalized follow-up email to reconnect/move the deal forward.
Return ONLY the subject and body.

Tone: Professional, concise, and friendly.
`;

  return [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: prompt },
  ];
}

/** Builds chat messages for the routine analysis action. */
function buildRoutineAnalysisMessages(data: {
  routine: { day: string; tasks: string[] }[];
  history: { date: string; rate: string }[];
}): ChatMessage[] {
  const prompt = `
Context: I am a solo founder trying to build a consistent high-performance routine.

My Routine Structure:
${JSON.stringify(data.routine)}

My Consistency History (Last 14 days):
${JSON.stringify(data.history)}

Task: Analyze my routine and consistency.
1. Identify patterns (do I slack off on Fridays? Is my Monday too heavy?).
2. Suggest 1 specific modification to improve consistency or impact.

Tone: Analytical but encouraging. Short and actionable.
`;

  return [
    { role: 'system', content: 'I am a productivity expert.' },
    { role: 'user', content: prompt },
  ];
}