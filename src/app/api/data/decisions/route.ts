import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security';
import { z } from 'zod';
import { logger } from '@/lib/logging/logger';

const actionSchema = z.object({
  action: z.enum(['add', 'update', 'delete']),
  payload: z.any(),
});

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    if (req.method === 'GET') {
      const decisions = await prisma.decision.findMany({ 
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });
      return NextResponse.json({ decisions });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, payload } = actionSchema.parse(body);

      switch (action) {
        case 'add':
          await prisma.decision.create({
            data: {
              id: payload.id,
              userId,
              title: payload.title,
              context: payload.context,
              category: payload.category || 'other',
              options: payload.options || [],
              aiChallenge: payload.aiChallenge,
              decidedOption: payload.decidedOption,
              rationale: payload.rationale,
              status: payload.status || 'open',
              decidedAt: payload.decidedAt ? new Date(payload.decidedAt) : null,
              reviewAt: payload.reviewAt ? new Date(payload.reviewAt) : null,
            }
          });
          break;

        case 'update':
          await prisma.decision.update({
            where: { id: payload.id, userId },
            data: {
              title: payload.title,
              context: payload.context,
              category: payload.category,
              options: payload.options,
              aiChallenge: payload.aiChallenge,
              decidedOption: payload.decidedOption,
              rationale: payload.rationale,
              status: payload.status,
              decidedAt: payload.decidedAt ? new Date(payload.decidedAt) : null,
              reviewAt: payload.reviewAt ? new Date(payload.reviewAt) : null,
              updatedAt: new Date()
            }
          });
          break;

        case 'delete':
          await prisma.decision.delete({
            where: { id: payload.id, userId }
          });
          break;

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    logger.error('[API Data Decisions] Error', error, { userId });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
