import { NextResponse } from 'next/server';
import { stripe } from '../infrastructure/stripe-client';
import { subscriptionRepository } from '../infrastructure/subscription.repository';
import { PRICING_CONFIG, type PlanType } from '../domain/types';
import { logger } from '@/lib/logging/logger';

export class StripeWebhookHandler {
  private repository = subscriptionRepository;

  async handleWebhook(req: Request): Promise<NextResponse> {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 401 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: ReturnType<typeof stripe.webhooks.constructEvent>;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      logger.error('[Stripe Webhook] Invalid signature', err);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Idempotency check
    try {
      await this.repository.logStripeEvent(event.id, event.type);
    } catch {
      // Event already processed
      return NextResponse.json({ received: true });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          const userId = session.metadata?.userId as string | undefined;
          const planKey = session.metadata?.plan as PlanType | 'founder' | undefined;
          const subscriptionId = session.subscription as string | undefined;

          if (!userId || !planKey || !subscriptionId) break;

          await this.repository.executeTransaction(async (tx) => {
            await this.repository.deleteSeatReservation(session.id, tx);

            const isFounderDeal = planKey === 'founder';
            const assignedPlan = isFounderDeal
              ? PRICING_CONFIG.founderDeal.planProvided
              : planKey;

            await tx.user.update({
              where: { id: userId },
              data: {
                planStatus: 'active',
                plan: assignedPlan,
                founderDeal: isFounderDeal,
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId: session.customer as string,
              },
            });
          });
          break;
        }

        case 'checkout.session.expired': {
          const session = event.data.object as any;
          const sessionId = session.id as string;

          const reservation = await this.repository.findSeatReservation(sessionId);

          if (reservation) {
            await this.repository.executeTransaction(async (tx) => {
              await this.repository.deleteSeatReservation(sessionId, tx);
              if (reservation.cohort === 'founder') {
                await this.repository.releaseFounderSeat(tx);
              }
            });
          }
          break;
        }

        case 'invoice.payment_succeeded':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          const customerId = subscription.customer as string;

          if (!customerId) break;

          let userId = subscription.metadata?.userId as string | undefined;
          if (!userId) {
            const customer = (await stripe.customers.retrieve(customerId)) as any;
            if (!customer.deleted) {
              userId = customer.metadata?.userId;
            }
          }

          if (!userId) {
            const user = await this.repository.findUserByStripeCustomerId(customerId);
            userId = user?.id;
          }

          if (!userId) break;

          const planAmount = subscription.items?.data[0]?.price?.unit_amount || 0;
          const interval = subscription.items?.data[0]?.price?.recurring?.interval || 'month';

          let mrr = 0;
          let arr = 0;

          if (interval === 'month') {
            mrr = planAmount / 100;
            arr = mrr * 12;
          } else if (interval === 'year') {
            arr = planAmount / 100;
            mrr = arr / 12;
          }

          await this.repository.updateUser(userId, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            mrr,
            arr,
            planStatus: 'active', // Webhooks grant active (Decision D7)
          });
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          let userId = subscription.metadata?.userId as string | undefined;

          if (!userId) {
            const customerId = subscription.customer as string;
            const user = await this.repository.findUserByStripeCustomerId(customerId);
            userId = user?.id;
          }

          if (userId) {
            // Fin of trial/sub = readonly (Decision D7)
            await this.repository.updateUser(userId, {
              mrr: 0,
              arr: 0,
              planStatus: 'readonly',
              stripeSubscriptionId: null,
            });
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          const userId =
            (invoice.metadata?.userId as string | undefined) ||
            (invoice.subscription_details?.metadata?.userId as string | undefined);

          if (userId) {
            logger.warn(
              `[Stripe Webhook] Payment failed for user ${userId}, invoice ${invoice.id}`,
              { userId, invoiceId: invoice.id }
            );
          }
          break;
        }
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      logger.error('[Stripe Webhook] Error processing event', error);
      return NextResponse.json(
        { error: 'Webhook handler failed' },
        { status: 500 }
      );
    }
  }
}

export const stripeWebhookHandler = new StripeWebhookHandler();
