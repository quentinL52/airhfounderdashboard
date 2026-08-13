import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/lib/logging/logger';

/**
 * POST /api/integrations/composio/webhook
 *
 * Webhook endpoint for Composio integration events.
 * Verifies the request signature using HMAC-SHA256 with COMPOSIO_WEBHOOK_SECRET.
 * Returns 401 if the signature is invalid or missing.
 */
export async function POST(req: Request) {
  try {
    // Verify HMAC signature
    const secret = process.env.COMPOSIO_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const body = await req.text();
    const signature = req.headers.get('x-signature') || req.headers.get('x-composio-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }

    // Verify HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.warn('[Composio Webhook] Invalid signature — possible forgery attempt');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Process webhook
    const data = JSON.parse(body);
    logger.info('Received Composio webhook', { preview: JSON.stringify(data).slice(0, 500) });

    // Composio handles OAuth tokens on their end — we just log for now
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Composio webhook handling error', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}