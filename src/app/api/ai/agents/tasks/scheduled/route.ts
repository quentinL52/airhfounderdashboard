import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/security';
import { assertQuota, recordAiAction } from '@/lib/billing/metering';

const prisma = new PrismaClient();

/**
 * GET /api/ai/agents/tasks/scheduled
 *
 * Liste les tâches récurrentes planifiées par l'utilisateur.
 * Retourne les tâches actives du user.
 */
async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
        try {
            await assertQuota(userId);
        } catch (e: any) {
            if (e.code === 'quota_reached') {
                return NextResponse.json({ code: 'quota_reached', error: 'AI actions limit reached for this month.' }, { status: 403 });
            }
            throw e;
        }

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