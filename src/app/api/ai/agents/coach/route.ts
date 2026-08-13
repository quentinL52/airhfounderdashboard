import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiEndpoint, InternalServerError } from '@/lib/api/create-api-endpoint';
import { executeAgent } from '@/lib/ai/agent-orchestrator';
import type { ProviderName } from '@/lib/ai/provider-interface';

// Ensure the agent is registered by importing it
import '@/lib/ai/agents/founder-coach';

const coachSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'gemini', 'mistral']),
  model: z.string().min(1),
  context: z.object({
    hypotheses: z.object({
      total: z.number(),
      tested: z.number(),
      validated: z.number(),
    }),
    finance: z.object({
      cash: z.number(),
      runway: z.number(),
      burnRate: z.number(),
    }),
    streak: z.number(),
    okrProgress: z.number(),
    journalMoods: z.array(z.string()),
    canvasCompleteness: z.number(),
    contactsCount: z.number(),
  }),
  locale: z.enum(['fr', 'en']).optional(),
});

export const POST = createApiEndpoint({
  bodySchema: coachSchema,
  async handler(req, { body, userId }) {
    const result = await executeAgent(
      'founder-coach',
      {
        userId,
        storeData: body.context as Record<string, unknown>,
        locale: body.locale || 'fr',
      },
      {
        provider: body.provider as ProviderName,
        model: body.model,
      },
    );

    if (result.status === 'failed') {
      throw new InternalServerError(result.error || 'Failed to execute founder coach.', result);
    }

    return NextResponse.json(result);
  },
});