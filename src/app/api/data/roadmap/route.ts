import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security';
import { z } from 'zod';
import { RoadmapStatus, RoadmapPriority } from '@prisma/client';
import { logger } from '@/lib/logging/logger';

const actionSchema = z.object({
  action: z.enum(['add', 'update', 'delete']),
  payload: z.any(),
});

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    if (req.method === 'GET') {
      const items = await prisma.roadmapItem.findMany({ 
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ roadmap: items });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, payload } = actionSchema.parse(body);

      switch (action) {
        case 'add':
          await prisma.roadmapItem.create({
            data: {
              id: payload.id,
              userId,
              title: payload.title,
              description: payload.description,
              status: payload.status as RoadmapStatus,
              priority: payload.priority as RoadmapPriority,
              week: payload.week,
              startDate: payload.startDate ? new Date(payload.startDate) : null,
              dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
            }
          });
          break;

        case 'update':
          await prisma.roadmapItem.update({
            where: { id: payload.id, userId },
            data: {
              title: payload.title,
              description: payload.description,
              status: payload.status as RoadmapStatus,
              priority: payload.priority as RoadmapPriority,
              week: payload.week,
              startDate: payload.startDate ? new Date(payload.startDate) : null,
              dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
              updatedAt: new Date()
            }
          });
          break;

        case 'delete':
          await prisma.roadmapItem.delete({
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
    logger.error('[API Data Roadmap] Error', error, { userId });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
