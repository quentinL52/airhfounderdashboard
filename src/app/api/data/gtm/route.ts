import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { logger } from '@/lib/logging/logger';
import { GtmStrategyService } from '@/modules/gtm';
import { PrismaGtmRepository } from '@/modules/gtm/infrastructure';
import { z } from 'zod';

const gtmRepo = new PrismaGtmRepository();
const gtmService = new GtmStrategyService();

const updateStrategySchema = z.object({
  sbHero: z.string().optional(),
  sbProblem: z.string().optional(),
  sbGuide: z.string().optional(),
  oaAlternatives: z.string().optional(),
  oaUniqueAttributes: z.string().optional(),
  oaValue: z.string().optional(),
  ompTarget: z.string().optional(),
  ompMessage: z.string().optional(),
  ompMedia: z.string().optional(),
  csAtomicNetwork: z.string().optional(),
  owCadence: z.string().optional(),
});

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    if (req.method === 'GET') {
      const existing = await gtmRepo.getGtmStrategy(userId);
      const strategy = gtmService.getOrInitializeStrategy(existing);
      const completeness = gtmService.evaluateCompleteness(strategy);

      return NextResponse.json({ strategy, completeness });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const validatedData = updateStrategySchema.parse(body);
      const updatedStrategy = await gtmRepo.upsertGtmStrategy(userId, validatedData);
      const completeness = gtmService.evaluateCompleteness(updatedStrategy);

      return NextResponse.json({ ok: true, strategy: updatedStrategy, completeness });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    logger.error('[API Data GTM] Error', error, { userId });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
