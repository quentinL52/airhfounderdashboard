import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Vérification sécurité cron
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Récupérer les tâches planifiées à exécuter
    const tasks = await prisma.scheduledTask.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
      },
      take: 10, // Limiter pour éviter timeout
    });

    const results = await Promise.allSettled(
      tasks.map(async (task: { id: string; userId: string; taskName: string; schedule: string; payload: any }) => {
        // Calculer la prochaine exécution basée sur le cron
        // Pour simplifier, on ajoute une estimation (à améliorer avec cron-parser)
        let nextRun: Date;
        const schedule = task.schedule;
        
        // Parsing basique des expressions cron courantes
        if (schedule.startsWith('0 ') && schedule.endsWith(' * * *')) {
          // Format: "0 H * * *" - quotidien à H heures
          const hour = parseInt(schedule.split(' ')[1]);
          nextRun = new Date(now);
          nextRun.setHours(hour, 0, 0, 0);
          if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
        } else if (schedule.startsWith('*/')) {
          // Format: "*/N * * * *" - toutes les N minutes
          const minutes = parseInt(schedule.split(' ')[0].replace('*/', ''));
          nextRun = new Date(now.getTime() + minutes * 60000);
        } else if (schedule.startsWith('0 */')) {
          // Format: "0 */N * * *" - toutes les N heures
          const hours = parseInt(schedule.split(' ')[1].replace('*/', ''));
          nextRun = new Date(now.getTime() + hours * 3600000);
        } else {
          // Par défaut : +1 jour
          nextRun = new Date(now.getTime() + 86400000);
        }

        // Mettre à jour la tâche
        await prisma.scheduledTask.update({
          where: { id: task.id },
          data: {
            lastRunAt: now,
            nextRunAt: nextRun,
          },
        });

        // Logger l'exécution
        await prisma.memoryNote.create({
          data: {
            userId: task.userId,
            content: `Cron exécuté: ${task.taskName}\nSchedule: ${task.schedule}\nPayload: ${JSON.stringify(task.payload)}`,
            type: 'decision',
            tags: ['cron', 'executed', task.taskName],
            source: 'cron-worker',
          },
        });

        return { taskId: task.id, taskName: task.taskName, status: 'executed', nextRun: nextRun.toISOString() };
      })
    );

    const successful = results.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled').length;
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Scheduled tasks processed: ${successful} executed, ${failed} failed`,
      results: results.map((r) => (r.status === 'fulfilled' ? r.value : { error: r.reason?.message })),
    });
  } catch (error) {
    logger.error('[Cron Scheduled Tasks] Error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}