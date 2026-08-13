import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { z } from 'zod';
import { logger } from '@/lib/logging/logger';
import { PrismaGtmRepository } from '@/modules/gtm/infrastructure';

const gtmRepo = new PrismaGtmRepository();

const actionSchema = z.object({
  action: z.enum(['add', 'update', 'delete']),
  payload: z.any(),
});

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    if (req.method === 'GET') {
      const hypotheses = await gtmRepo.getHypotheses(userId);
      return NextResponse.json({ hypotheses });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, payload } = actionSchema.parse(body);

      switch (action) {
        case 'add':
          await gtmRepo.createHypothesis(userId, payload);
          break;

        case 'update':
          await gtmRepo.updateHypothesis(userId, payload.id, payload);
          break;

        case 'delete':
          await gtmRepo.deleteHypothesis(userId, payload.id);
          break;

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    logger.error('[API Data Hypotheses] Error', error, { userId });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
