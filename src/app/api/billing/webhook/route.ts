import { NextResponse } from 'next/server';
import { processStripeWebhookEvent } from '@/modules/billing/infrastructure/webhook-handler';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 401 }
    );
  }

  const result = await processStripeWebhookEvent(body, signature);
  return NextResponse.json(result.body, { status: result.status });
}
