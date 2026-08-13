import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security';
import { z } from 'zod';
import { logger } from '@/lib/logging/logger';
import { refreshKeyResults } from '@/services/okr.service';

const actionSchema = z.object({
  action: z.enum(['add', 'update', 'delete', 'refresh']),
  payload: z.any().optional(),
});

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    if (req.method === 'GET') {
      const keyResults = await prisma.keyResult.findMany({ 
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });
      return NextResponse.json({ keyResults });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, payload } = actionSchema.parse(body);

      switch (action) {
        case 'add':
          await prisma.keyResult.create({
            data: {
              id: payload.id,
              objectiveId: payload.objectiveId,
              userId,
              title: payload.title,
              sourceType: payload.sourceType,
              sourceConfig: payload.sourceConfig,
              target: payload.target,
              current: payload.current || 0,
              unit: payload.unit,
            }
          });
          break;

        case 'update':
          await prisma.keyResult.update({
            where: { id: payload.id, userId },
            data: {
              title: payload.title,
              sourceType: payload.sourceType,
              sourceConfig: payload.sourceConfig,
              target: payload.target,
              current: payload.current,
              unit: payload.unit,
            }
          });
          break;

        case 'delete':
          await prisma.keyResult.delete({
            where: { id: payload.id, userId }
          });
          break;

        case 'refresh':
          await refreshKeyResults(userId);
          break;

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    logger.error('[API Data KeyResults] Error', error, { userId });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
