import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { assertQuota, recordAiAction } from '@/lib/billing/metering';

const prisma = new PrismaClient();

/**
 * GET /api/ai/agents/tasks
 *
 * Liste les tâches déléguées par l'utilisateur à ses sub-agents.
 * Retourne les dernières 50 tâches, triées par date de création.
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

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const agentRole = url.searchParams.get('agentRole');
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);

    const tasks = await agentRepository.listTasks(userId, limit);

    return NextResponse.json({ tasks });
  } catch (error) {
    logger.error('[Agent Tasks API] Error', error, { userId });
    return NextResponse.json(
      { error: 'Failed to fetch agent tasks' },
      { status: 500 },
    );
  }
}

export const GET = withAuth(handler);