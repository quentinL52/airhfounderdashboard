import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security/with-auth';
import { stripe } from '@/lib/billing/stripe-client';
import { logger } from '@/lib/logging/logger';

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deletionRequestedAt: true, stripeSubscriptionId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.deletionRequestedAt) {
      return NextResponse.json({ ok: true, message: 'Deletion not requested' });
    }

    let nextStatus = 'readonly';

    if (user.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        if (sub.status === 'active' || sub.status === 'trialing') {
          nextStatus = 'active'; // ou trialing
        }
      } catch (err: any) {
        logger.error('[CANCEL_DELETION] Failed to retrieve Stripe subscription', err, { userId });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: null,
        planStatus: nextStatus
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('[CANCEL_DELETION_ERROR]', error, { userId });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
