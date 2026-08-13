import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withValidation } from '@/lib/security';
import { executeAgent } from '@/lib/ai/agent-orchestrator';
import type { ProviderName } from '@/lib/ai/provider-interface';
import { assertQuota, recordAiAction } from '@/lib/billing/metering';

// Ensure the agent is registered
import '@/lib/ai/agents/content-creator';

const contentSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'gemini', 'mistral']),
  model: z.string().min(1),
  context: z.object({
    leanCanvas: z.record(z.string()),
    goToMarket: z.object({
      sbHero: z.string().optional(),
      sbProblem: z.string().optional(),
      ompTarget: z.string().optional(),
      ompMessage: z.string().optional(),
    }),
    existingContent: z.array(
      z.object({
        title: z.string(),
        type: z.string(),
      }),
    ),
    founderProfile: z
      .object({
        linkedinUrl: z.string(),
        writingStyleContext: z.string(),
        displayName: z.string(),
        niche: z.string(),
      })
      .optional(),
    userInstruction: z.string().optional(),
  }),
  locale: z.enum(['fr', 'en']).optional(),
});

const handler = withAuth(
  withValidation(contentSchema)(
    async (
      req: NextRequest,
      { userId, body }: { userId: string; body: z.infer<typeof contentSchema> },
    ) => {
      try {
        const result = await executeAgent(
          'content-creator',
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
        logger.error('[Content API Route] Error', error, { userId });
        return NextResponse.json(
          { error: 'Internal server error while executing content creator.' },
          { status: 500 },
        );
      }
    },
  ),
);

export const POST = handler;