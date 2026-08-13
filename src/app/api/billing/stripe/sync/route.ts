import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security/with-auth';
import { billingService } from '@/modules/billing';
import { logger } from '@/lib/logging/logger';

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    const { forceFullSync } = await req.json().catch(() => ({ forceFullSync: false }));
    const forceSync = Boolean(forceFullSync);

    const result = await billingService.syncStripeUserData(userId, forceSync);

    if (!result.synced) {
      return NextResponse.json({
        message: result.message,
        synced: result.data,
      });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      synced: result.data,
    });
  } catch (error) {
    logger.error('[API /billing/stripe/sync] Error', error, { userId });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);