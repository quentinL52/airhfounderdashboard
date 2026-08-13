import { NextResponse } from 'next/server';
import { processDailyWatchReminders } from '@/services/watch.service';
import { logger } from '@/lib/logging/logger';

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET configuration missing' }, { status: 500 });
  }

  const authHeader = req.headers.get('Authorization');
  const cronHeader = req.headers.get('x-cron-secret');
  const isValid = authHeader === `Bearer ${cronSecret}` || cronHeader === cronSecret;

  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processDailyWatchReminders();
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    logger.error('[Cron Watch Reminders] Error', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
