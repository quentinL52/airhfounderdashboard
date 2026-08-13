import { PRICING_CONFIG } from './pricing-config';
import { prisma } from '@/lib/prisma';

// Limite dure d'actions IA (ex: requêtes chat) par mois
export const AI_ACTIONS_LIMIT = PRICING_CONFIG.plans.complete.limits.aiActions;

/**
 * Enregistre une action IA et le nombre de tokens consommés.
 */
export async function recordAiAction(userId: string, scope: string, tokens: number = 0, model: string = 'gpt-4o') {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  await prisma.aiUsage.upsert({
    where: {
      userId_month_scope: {
        userId,
        month,
        scope,
      }
    },
    update: {
      actions: { increment: 1 },
      tokens: { increment: tokens },
    },
    create: {
      userId,
      month,
      scope,
      model,
      actions: 1,
      tokens,
    }
  });
}

/**
 * Vérifie si l'utilisateur a dépassé son quota d'actions IA.
 * Lève une exception avec 'quota_reached' si c'est le cas.
 */
export async function assertQuota(userId: string) {
  const month = new Date().toISOString().slice(0, 7);
  
  const usages = await prisma.aiUsage.findMany({
    where: { userId, month }
  });
  
  const totalActions = usages.reduce((sum, u) => sum + u.actions, 0);
  
  if (totalActions >= AI_ACTIONS_LIMIT) {
    const error = new Error('AI_QUOTA_REACHED');
    (error as any).code = 'quota_reached';
    throw error;
  }
  
  return totalActions;
}

/**
 * Récupère l'utilisation IA courante pour un utilisateur.
 */
export async function getAiUsage(userId: string) {
  const month = new Date().toISOString().slice(0, 7);
  const usages = await prisma.aiUsage.findMany({
    where: { userId, month }
  });
  
  const totalActions = usages.reduce((sum, u) => sum + u.actions, 0);
  const totalTokens = usages.reduce((sum, u) => sum + u.tokens, 0);
  
  return {
    actions: totalActions,
    tokens: totalTokens,
    limit: AI_ACTIONS_LIMIT,
    percentage: Math.min(100, Math.round((totalActions / AI_ACTIONS_LIMIT) * 100)),
  };
}
