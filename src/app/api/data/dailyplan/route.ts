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
      const { searchParams } = new URL(req.url);
      const dateStr = searchParams.get('date');
      
      let whereClause: any = { userId };
      if (dateStr) {
        whereClause.date = new Date(dateStr);
      }
      
      const plans = await prisma.dailyPlan.findMany({ 
        where: whereClause,
        orderBy: { date: 'desc' },
        take: dateStr ? 1 : 14 // Return 1 if date specified, otherwise last 14 days
      });
      return NextResponse.json({ plans });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, payload } = actionSchema.parse(body);

      switch (action) {
        case 'add':
          await prisma.dailyPlan.create({
            data: {
              id: payload.id,
              userId,
              date: new Date(payload.date),
              top3: payload.top3 || [],
              snoozed: payload.snoozed || [],
              shutdownAt: payload.shutdownAt ? new Date(payload.shutdownAt) : null,
            }
          });
          break;

        case 'update':
          await prisma.dailyPlan.update({
            where: { id: payload.id, userId },
            data: {
              top3: payload.top3,
              snoozed: payload.snoozed,
              shutdownAt: payload.shutdownAt ? new Date(payload.shutdownAt) : null,
            }
          });
          break;

        case 'delete':
          await prisma.dailyPlan.delete({
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
    logger.error('[API Data DailyPlan] Error', error, { userId });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
