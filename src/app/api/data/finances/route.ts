import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { logger } from '@/lib/logging/logger';
import { financialService } from '@/modules/finances/application/financial-service';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum([
    'updateSettings',
    'addEntry',
    'updateEntry',
    'deleteEntry',
    'addOneTimeEntry',
    'deleteOneTimeEntry',
  ]),
  payload: z.any(),
});

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    if (req.method === 'GET') {
      const data = await financialService.getFinancialOverview(userId);
      return NextResponse.json(data);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, payload } = actionSchema.parse(body);

      const result = await financialService.processFinancialAction(userId, action, payload);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    logger.error('[API Data Finances] Error', error, { userId });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
