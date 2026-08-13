import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { z } from 'zod';
import { getWatchSettings, updateWatchSettings } from '@/services/watch.service';
import { logger } from '@/lib/logging/logger';

const updateSchema = z.object({
  frequency: z.enum(['manual', 'weekly', 'biweekly', 'monthly']).optional(),
  scope: z.object({
    competitors: z.array(z.string()).default([]),
    queries: z.array(z.string()).default([]),
  }).optional(),
  remindersEnabled: z.boolean().optional(),
});

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    if (req.method === 'GET') {
      const settings = await getWatchSettings(userId);
      return NextResponse.json({ settings });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const validatedData = updateSchema.parse(body);
      const updated = await updateWatchSettings(userId, validatedData);
      return NextResponse.json({ ok: true, settings: updated });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    logger.error('[API Data WatchSettings] Error', error, { userId });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
