import Stripe from 'stripe';
import { stripe } from './stripe-client';
import { prisma } from '@/lib/prisma';
import { releaseFounderSeat } from './founder-deal-repository';
import { PRICING_CONFIG, type PlanType } from '../domain/types';
import { logger } from '@/lib/logging/logger';

export async function processStripeWebhookEvent(
  body: string,
  signature: string
): Promise<{ status: number; body: Record<string, any> }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return { status: 500, body: { error: 'Webhook secret not configured' } };
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.error('[Stripe Webhook] Invalid signature', err);
    return { status: 400, body: { error: 'Invalid signature' } };
  }

  // Idempotency check
  try {
    await prisma.stripeEventLog.create({
      data: { eventId: event.id, type: event.type },
    });
  } catch {
    return { status: 200, body: { received: true } };
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planKey = session.metadata?.plan as PlanType | 'founder' | undefined;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (!userId || !planKey || !subscriptionId) break;

        await prisma.$transaction(async (tx) => {
          await tx.seatReservation.deleteMany({ where: { sessionId: session.id } });

          const isFounderDeal = planKey === 'founder';
          const assignedPlan = isFounderDeal ? PRICING_CONFIG.founderDeal.planProvided : planKey;

          // Decision D7: Only Stripe webhook confirmation sets planStatus to 'active'
          await tx.user.update({
            where: { id: userId },
            data: {
              planStatus: 'active',
              plan: assignedPlan,
              founderDeal: isFounderDeal,
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: (typeof session.customer === 'string' ? session.customer : session.customer?.id) ?? null,
            },
          });
        });
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.id;

        const reservation = await prisma.seatReservation.findUnique({
          where: { sessionId },
        });

        if (reservation) {
          await prisma.$transaction(async (tx) => {
            await tx.seatReservation.delete({ where: { sessionId } });
            if (reservation.cohort === 'founder') {
              await releaseFounderSeat(tx);
            }
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          // Decision D7: End of subscription sets state to 'readonly' (never delete user data)
          await prisma.user.update({
            where: { id: userId },
            data: { planStatus: 'readonly' },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const userId =
          (invoice.metadata?.userId as string | undefined) ||
          ((invoice as any).subscription_details?.metadata?.userId as string | undefined);

        if (userId) {
          logger.warn(
            `[Stripe Webhook] Payment failed for user ${userId}, invoice ${invoice.id}`,
            { userId, invoiceId: invoice.id }
          );
        }
        break;
      }
    }

    return { status: 200, body: { received: true } };
  } catch (error) {
    logger.error('[Stripe Webhook] Error processing event', error);
    return { status: 500, body: { error: 'Webhook handler failed' } };
  }
}
