import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe, resolvePrice } from '../infrastructure/stripe-client';
import { reserveFounderSeat } from '../infrastructure/founder-deal-repository';
import { processStripeWebhookEvent } from '../infrastructure/webhook-handler';
import { PRICING_CONFIG, type Period, type PlanType, type PricingStatusResponse } from '../domain/types';
import { sendTrialEndingEmail } from '@/lib/email/email-service';
import { canWrite } from '../domain/entitlements';

export async function createCheckoutSession(
  userId: string,
  plan: PlanType | 'founder',
  period: Period = 'monthly'
): Promise<{ url?: string; plan?: string; error?: string; status?: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { error: 'User not found', status: 404 };
  }

  if (user.planStatus === 'active') {
    return { error: 'Already subscribed. Use the Stripe portal to manage.', status: 409 };
  }

  return await prisma.$transaction(async (tx) => {
    let priceId = '';
    let key = '';

    if (plan === 'founder') {
      const reserved = await reserveFounderSeat(tx);
      if (!reserved) {
        return { error: 'Founder deal is sold out.', status: 400 };
      }
      key = PRICING_CONFIG.founderDeal.price.key;
      priceId = process.env.STRIPE_PRICE_FOUNDER_MONTHLY || '';
    } else {
      const planConfig = PRICING_CONFIG.plans[plan];
      if (!planConfig) return { error: 'Invalid plan', status: 400 };

      const priceConfig = planConfig.prices[period];
      if (!priceConfig) {
        return { error: `Period ${period} not available for ${plan}`, status: 400 };
      }
      key = priceConfig.key;
      priceId = resolvePrice(key as any);
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await tx.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/settings?billing=success`,
      cancel_url: `${baseUrl}/settings?billing=canceled`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      metadata: { userId: user.id, plan, period, priceKey: key },
    });

    if (plan === 'founder') {
      await tx.seatReservation.create({
        data: {
          userId: user.id,
          cohort: 'founder',
          sessionId: checkoutSession.id,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
    }

    return { url: checkoutSession.url || undefined, plan };
  });
}

export async function createPortalSession(userId: string): Promise<{ url?: string; error?: string; status?: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.stripeCustomerId) {
    return { error: 'User or Stripe customer not found', status: 404 };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${baseUrl}/settings/billing`,
  });

  return { url: portalSession.url };
}

export async function getPricingStatus(): Promise<PricingStatusResponse> {
  const counter = await prisma.founderDealCounter.findUnique({
    where: { id: 'singleton' },
  });

  const sold = counter?.sold ?? 0;
  const isAvailable = sold < PRICING_CONFIG.founderDeal.maxUsers;
  const seatsLeft = Math.max(0, PRICING_CONFIG.founderDeal.maxUsers - sold);

  return {
    founderDeal: {
      isAvailable,
      seatsLeft,
      taken: sold,
      max: PRICING_CONFIG.founderDeal.maxUsers,
    },
    plans: PRICING_CONFIG.plans,
  };
}

export async function syncStripeUserData(
  userId: string,
  forceSync: boolean = false
): Promise<{ synced: boolean; message: string; data: any }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.stripeCustomerId) {
    return { synced: false, message: 'User or Stripe customer not found', data: null };
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: 'active',
  });

  let mrr = 0;
  for (const sub of subscriptions.data) {
    for (const item of sub.items.data) {
      const price = item.price;
      if (price.recurring?.interval === 'month') {
        mrr += ((price.unit_amount || 0) / 100) * (item.quantity || 1);
      } else if (price.recurring?.interval === 'year') {
        mrr += (((price.unit_amount || 0) / 100) * (item.quantity || 1)) / 12;
      }
    }
  }

  const arr = mrr * 12;
  await prisma.user.update({
    where: { id: user.id },
    data: { mrr, arr },
  });

  return {
    synced: true,
    message: 'Stripe user data synced successfully',
    data: { mrr, arr },
  };
}

export async function expireTrials(): Promise<number> {
  const now = new Date();
  const result = await prisma.user.updateMany({
    where: {
      planStatus: 'trialing',
      trialEndsAt: { lt: now },
    },
    data: { planStatus: 'readonly' },
  });

  return result.count;
}

export async function notifyTrialExpiringSoon(): Promise<number> {
  const now = new Date();
  const inFourDays = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      planStatus: 'trialing',
      trialEndsAt: { gte: inThreeDays, lt: inFourDays },
    },
    select: { email: true, name: true },
  });

  for (const user of users) {
    await sendTrialEndingEmail(user.email, user.name || 'Founder', 4);
  }

  return users.length;
}

export async function assertCanWrite(userId: string): Promise<NextResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planStatus: true },
  });

  if (!user || !canWrite(user.planStatus)) {
    return NextResponse.json(
      { error: 'subscription_required' },
      { status: 403 },
    );
  }

  return null;
}

export const billingService = {
  createCheckoutSession,
  createPortalSession,
  getPricingStatus,
  syncStripeUserData,
  assertCanWrite,
};

export const stripeWebhookHandler = {
  async handleWebhook(req: Request) {
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
  },
};
