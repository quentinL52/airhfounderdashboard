import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/security';
import { logger } from '@/lib/logging/logger';

const prisma = new PrismaClient();

/**
 * GET /api/ai/agents/tasks/scheduled
 *
 * Liste les tâches récurrentes planifiées par l'utilisateur.
 * Retourne les tâches actives du user.
 */
async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    const tasks = await prisma.scheduledTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    logger.error('[Scheduled Tasks API] Error', error, { userId });
    return NextResponse.json(
      { error: 'Failed to fetch scheduled tasks' },
      { status: 500 },
    );
  }
}

export const GET = withAuth(handler);