import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/security/with-auth';
import { createCheckoutSession } from '@/modules/billing';

const bodySchema = z.object({
  plan: z.enum(['core', 'complete', 'founder']),
  period: z.enum(['monthly']),
});

async function handler(req: NextRequest, { userId }: { userId: string }) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid period', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { plan, period } = parsed.data;

  const result = await createCheckoutSession(userId, plan as any, period);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status || 400 });
  }

  return NextResponse.json({ url: result.url, plan: result.plan });
}

export const POST = withAuth(handler);
