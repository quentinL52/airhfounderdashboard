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
      const objectives = await prisma.objective.findMany({ 
        where: { userId },
        include: { keyResults: true },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ objectives });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, payload } = actionSchema.parse(body);

      switch (action) {
        case 'add':
          await prisma.objective.create({
            data: {
              id: payload.id,
              userId,
              title: payload.title,
              period: payload.period,
              status: payload.status || 'active',
            }
          });
          break;

        case 'update':
          await prisma.objective.update({
            where: { id: payload.id, userId },
            data: {
              title: payload.title,
              period: payload.period,
              status: payload.status,
            }
          });
          break;

        case 'delete':
          await prisma.objective.delete({
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
    logger.error('[API Data Objectives] Error', error, { userId });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
