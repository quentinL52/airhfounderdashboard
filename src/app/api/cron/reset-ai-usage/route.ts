import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PRICING_CONFIG } from '@/lib/billing/pricing-config';
import { logger } from '@/lib/logging/logger';

// This endpoint is meant to be called by a cron job on the 1st of every month
// E.g., Vercel Cron or GitHub Actions.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const limit = PRICING_CONFIG.plans.complete.limits.aiActions;

  try {
    // We could proactively create rows for all active "complete" and "founder" users,
    // but metering.ts handles it lazily via upsert. 
    // This cron can just be used for reporting or cleanup of old data if needed.
    
    // As a placeholder for "monthly reset", we can log how many users were active last month.
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
    const usages = await prisma.aiUsage.count({
      where: { month: lastMonth }
    });

    logger.info(`[Cron] Reset AI Usage triggered for ${currentMonth}. Previous month (${lastMonth}) had ${usages} active AI users.`, { currentMonth, lastMonth, usages });

    return NextResponse.json({ success: true, currentMonth, lastMonthUsages: usages });
  } catch (error) {
    logger.error('[Cron] Error resetting AI usage', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
