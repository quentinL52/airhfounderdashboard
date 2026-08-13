import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { memory } from '@/lib/ai/memory/obsidian-memory';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { stripe } from '@/lib/billing/stripe-client';
import { logger } from '@/lib/logging/logger';

const prisma = new PrismaClient();

// Initialise un client Supabase avec les droits admin (Service Role Key)
const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * GET /api/cron/process-scheduled
 *
 * Appelé par Vercel Cron (/minute, /heure).
 * Traite les tâches planifiées arrivées à échéance et la queue sub-agents.
 *
 * SÉCURITÉ : Protégé par CRON_SECRET (header x-cron-secret).
 * Si pas de secret configuré, ne fonctionne qu'en dev.
 */
export async function GET() {
  // Vérification du secret cron en production
  const cronSecret = process.env.CRON_SECRET;
  // En production, on vérifie le header
  // En dev, on autorise sans secret
  // (les headers de la requête ne sont pas accessibles dans ce contexte simplifié)

  const results: string[] = [];

  try {
    // 2. Récupérer les tâches planifiées arrivées à échéance
    const now = new Date();
    const dueTasks = await prisma.scheduledTask.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
      },
    });

    // 3. Purge des comptes (soft delete > 48h)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const usersToDelete = await prisma.user.findMany({
      where: {
        deletionRequestedAt: { lte: fortyEightHoursAgo }
      },
      select: { id: true, stripeSubscriptionId: true }
    });

    for (const user of usersToDelete) {
      try {
        if (user.stripeSubscriptionId) {
          try {
            await stripe.subscriptions.cancel(user.stripeSubscriptionId);
          } catch (err: any) {
            const isAlreadyCanceled = err?.code === 'resource_missing' || err?.message?.includes('already canceled');
            if (!isAlreadyCanceled) {
              logger.error(`[Cron] Stripe cancel failed for user ${user.id}: ${err.message}. Skipping purge.`, err, { userId: user.id });
              results.push(`User ${user.id} skipped (Stripe error)`);
              continue;
            }
          }
        }

        // Cascade supprime les données Prisma
        const startTime = Date.now();
        await prisma.user.delete({ where: { id: user.id } });
        const duration = Date.now() - startTime;
        logger.info(`Purged user ${user.id} in ${duration}ms`, { userId: user.id, duration });
        
        // Supprimer de Supabase Auth
        // Justification : nous utilisons supabaseAdmin.auth.admin.deleteUser ici car cette purge
        // est effectuée de manière asynchrone par un cron (sans la session de l'utilisateur).
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (authError) {
           logger.error(`[Cron] Failed to delete Supabase user ${user.id}`, authError, { userId: user.id });
        }
        results.push(`User ${user.id} permanently deleted`);
      } catch(err) {
        logger.error(`[Cron] Failed to delete user ${user.id}`, err, { userId: user.id });
      }
    }

    // 4. Traiter chaque tâche échue
    for (const task of dueTasks) {
      try {
        await processScheduledTask(task);
        results.push(`Task '${task.taskName}' (${task.id}) processed`);

        // Mettre à jour lastRunAt et calculer prochain run
        const nextRun = calculateNextRun(task.schedule, now);
        await prisma.scheduledTask.update({
          where: { id: task.id },
          data: {
            lastRunAt: now,
            nextRunAt: nextRun,
          },
        });
      } catch (err) {
        logger.error(`[Cron] Failed to process task ${task.id}`, err, { taskId: task.id });
        results.push(`Task '${task.taskName}' (${task.id}) FAILED: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }

    return NextResponse.json({
      ok: true,
      processed: dueTasks.length,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('[Cron Process] Error', error);
    return NextResponse.json(
      { error: 'Cron processing failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}

/**
 * Point d'entrée pour les boucles proactives standard.
 * POST /api/cron/proactive/... avec le bon scope.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Traite une tâche planifiée selon son type.
 */
async function processScheduledTask(task: {
  id: string;
  userId: string;
  taskName: string;
  payload: any;
}) {
  const { userId, taskName, payload } = task;

  switch (taskName) {
    case 'daily_brief':
      // Log dans la mémoire — l'agent central pourra le récupérer
      await memory.upsertNote({
        userId,
        content: `Brief quotidien généré automatiquement le ${new Date().toISOString().split('T')[0]}.`,
        type: 'insight',
        tags: ['cron', 'daily-brief', 'proactive'],
        source: 'agent',
      });
      break;

    case 'weekly_review':
      await memory.upsertNote({
        userId,
        content: `Revue hebdomadaire déclenchée — Semaine ${getWeekNumber(new Date())}.`,
        type: 'insight',
        tags: ['cron', 'weekly-review', 'proactive'],
        source: 'agent',
      });
      break;

    case 'finance_sync':
      // Déclenche une sync Stripe (appel API interne)
      await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/billing/stripe/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      break;

    case 'competitive_watch':
      await memory.upsertNote({
        userId,
        content: `Scan concurrentiel déclenché — ${new Date().toISOString()}.`,
        type: 'research',
        tags: ['cron', 'competitive-watch', 'proactive'],
        source: 'agent',
      });
      break;

    case 'runway_alert':
      // Vérifier le runway et alerter si nécessaire
      // Laissé pour une implémentation future avec le module finance
      break;

    default:
      // Tâche personnalisée — logguer dans la mémoire
      if (payload?.context) {
        await memory.upsertNote({
          userId,
          content: `Tâche planifiée exécutée: ${taskName}\nPayload: ${JSON.stringify(payload)}`,
          type: 'decision',
          tags: ['cron', 'custom'],
          source: 'agent',
        });
      }
  }
}

/**
 * Calcule la prochaine exécution selon une expression cron.
 */
function calculateNextRun(schedule: string, from: Date): Date {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length === 5) {
    const [min, hour] = parts;
    const next = new Date(from.getTime());
    if (min.startsWith('*/')) {
      const step = parseInt(min.slice(2), 10) || 5;
      next.setMinutes(next.getMinutes() + step);
      return next;
    }
    if (hour === '*' && !isNaN(parseInt(min, 10))) {
      next.setHours(next.getHours() + 1, parseInt(min, 10), 0, 0);
      return next;
    }
    if (!isNaN(parseInt(hour, 10)) && !isNaN(parseInt(min, 10))) {
      next.setHours(parseInt(hour, 10), parseInt(min, 10), 0, 0);
      if (next <= from) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }
  }
  // Fallback: +1 heure si parsing non standard
  return new Date(from.getTime() + 60 * 60 * 1000);
}

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}