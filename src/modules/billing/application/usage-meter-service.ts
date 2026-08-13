import { prisma } from '@/lib/prisma';
import { calculateUsageMeter, hasExceededAiQuota } from '../domain/entitlements';
import type { UsageMeterData, PlanType } from '../domain/types';
import { getAiUsageForUser, recordAiUsage } from '../infrastructure/usage-repository';

export async function getUserUsageMeter(userId: string): Promise<UsageMeterData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planStatus: true },
  });

  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const actionsUsed = await getAiUsageForUser(userId, month);

  const plan = (user?.plan as PlanType) || null;
  const planStatus = user?.planStatus || 'readonly';

  return calculateUsageMeter(userId, plan, planStatus, month, actionsUsed);
}

export async function trackAiAction(
  userId: string,
  scope: string,
  model: string,
  actionsCount: number = 1,
  tokensCount: number = 0
): Promise<{ allowed: boolean; usage: UsageMeterData }> {
  const currentUsage = await getUserUsageMeter(userId);

  if (hasExceededAiQuota(currentUsage)) {
    return { allowed: false, usage: currentUsage };
  }

  await recordAiUsage(userId, scope, model, actionsCount, tokensCount);

  const updatedUsage = await getUserUsageMeter(userId);
  return {
    allowed: !hasExceededAiQuota(updatedUsage),
    usage: updatedUsage,
  };
}
