import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withValidation } from '@/lib/security';
import { executeAgent } from '@/lib/ai/agent-orchestrator';
import type { ProviderName } from '@/lib/ai/provider-interface';
import { logger } from '@/lib/logging/logger';

// Ensure the agent is registered
import '@/lib/ai/agents/relationship-manager';

const crmSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'gemini', 'mistral']),
  model: z.string().min(1),
  context: z.object({
    contacts: z.array(z.any()),
    projectPhase: z.string(),
    goToMarket: z.object({
      ompTarget: z.string().optional(),
    }),
    userInstruction: z.string().optional(),
  }),
  locale: z.enum(['fr', 'en']).optional(),
});

const handler = withAuth(
  withValidation(crmSchema)(
    async (
      req: NextRequest,
      { userId, body }: { userId: string; body: z.infer<typeof crmSchema> },
    ) => {
      try {
        const result = await executeAgent(
          'relationship-manager',
          {
            userId,
            storeData: body.context as Record<string, unknown>,
            userInstruction: body.context.userInstruction,
            locale: body.locale || 'fr',
          },
          {
            provider: body.provider as ProviderName,
            model: body.model,
          },
        );

        if (result.status === 'failed') {
          return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result);
      } catch (error) {
        logger.error('[CRM API Route] Error', error, { userId });
        return NextResponse.json(
          { error: 'Internal server error while executing relationship manager.' },
          { status: 500 },
        );
      }
    },
  ),
);

export const POST = handler;