import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';
import { stripeSyncAdapter } from '@/modules/finances/infrastructure/adapters/stripe-sync-adapter';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Check cron secret
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        stripeCustomerId: { not: null },
      },
      select: { id: true },
    });

    const results = await Promise.allSettled(
      users.map(async (user: { id: string }) => {
        await stripeSyncAdapter.syncUserStripeData(user.id);
        return { userId: user.id, status: 'synced' as const };
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Stripe sync completed: ${successful} succeeded, ${failed} failed`,
      results,
    });
  } catch (error) {
    logger.error('[Cron Stripe Sync] Error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}