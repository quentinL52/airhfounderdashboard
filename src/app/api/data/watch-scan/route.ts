import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { executeWatchScan } from '@/services/watch.service';
import { logger } from '@/lib/logging/logger';

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    const result = await executeWatchScan(userId);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('[API Data WatchScan] Error', error, { userId });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
