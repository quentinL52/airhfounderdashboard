import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { logger } from '@/lib/logging/logger';
import { stripeSyncAdapter } from '@/modules/finances/infrastructure/adapters/stripe-sync-adapter';

async function handler(req: NextRequest, { userId }: { userId: string }) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const result = await stripeSyncAdapter.syncMrrViaComposio(userId);
    return NextResponse.json(result);
  } catch (e: any) {
    logger.error('[Stripe Sync MRR Error]', e, { userId });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
