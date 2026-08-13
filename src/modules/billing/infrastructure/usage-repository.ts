import { prisma } from '@/lib/prisma';

export async function getAiUsageForUser(userId: string, month: string): Promise<number> {
  const usageRecords = await prisma.aiUsage.findMany({
    where: {
      userId,
      month,
    },
    select: {
      actions: true,
    },
  });

  return usageRecords.reduce((sum, record) => sum + (record.actions || 0), 0);
}

export async function recordAiUsage(
  userId: string,
  scope: string,
  model: string,
  actionsCount: number = 1,
  tokensCount: number = 0
): Promise<void> {
  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  await prisma.aiUsage.upsert({
    where: {
      userId_month_scope: {
        userId,
        month,
        scope,
      },
    },
    create: {
      userId,
      month,
      scope,
      model,
      actions: actionsCount,
      tokens: tokensCount,
    },
    update: {
      actions: { increment: actionsCount },
      tokens: { increment: tokensCount },
      model,
    },
  });
}
