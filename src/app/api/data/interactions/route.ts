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
      const interactions = await prisma.interaction.findMany({ 
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ interactions });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, payload } = actionSchema.parse(body);

      switch (action) {
        case 'add':
          await prisma.interaction.create({
            data: {
              id: payload.id,
              userId,
              contactId: payload.contactId,
              type: payload.type || 'note',
              content: payload.content,
            }
          });
          break;

        case 'update':
          await prisma.interaction.update({
            where: { id: payload.id, userId },
            data: {
              contactId: payload.contactId,
              type: payload.type,
              content: payload.content,
            }
          });
          break;

        case 'delete':
          await prisma.interaction.delete({
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
    logger.error('[API Data Interactions] Error', error, { userId });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
