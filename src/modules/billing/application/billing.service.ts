import { PRICING_CONFIG, type Period, type PlanType } from '../domain/types';
import { subscriptionRepository } from '../infrastructure/subscription.repository';
import { stripe, resolvePrice } from '../infrastructure/stripe-client';
import { recalculateRunway } from '@/lib/billing/runway-calculator';
import { logger } from '@/lib/logging/logger';

export class BillingService {
  private repository = subscriptionRepository;

  async getPricingStatus() {
    const counter = await this.repository.getFounderDealCounter();
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

  async createCheckoutSession(userId: string, plan: PlanType | 'founder', period: Period) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      return { error: 'User not found', status: 404 as const };
    }

    if (user.planStatus === 'active') {
      return { error: 'Already subscribed. Use the Stripe portal to manage.', status: 409 as const };
    }

    return this.repository.executeTransaction(async (tx) => {
      let priceId = '';
      let key = '';

      if (plan === 'founder') {
        const reserved = await this.repository.reserveFounderSeat(tx);
        if (!reserved) {
          return { error: 'Founder deal is sold out.', status: 400 as const };
        }
        key = PRICING_CONFIG.founderDeal.price.key;
        priceId = process.env.STRIPE_PRICE_FOUNDER_MONTHLY || '';
      } else {
        const planConfig = PRICING_CONFIG.plans[plan];
        if (!planConfig) {
          return { error: 'Invalid plan', status: 400 as const };
        }

        const priceConfig = planConfig.prices[period];
        if (!priceConfig) {
          return { error: `Period ${period} not available for ${plan}`, status: 400 as const };
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

      const session = await stripe.checkout.sessions.create({
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
            sessionId: session.id,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        });
      }

      return { url: session.url, plan, status: 200 as const };
    });
  }

  async createPortalSession(userId: string) {
    const user = await this.repository.findUserById(userId);
    if (!user || !user.stripeCustomerId) {
      return { error: 'User or Stripe customer not found', status: 404 as const };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/settings/billing`,
    });

    return { url: session.url, status: 200 as const };
  }

  async syncStripeUserData(userId: string, forceFullSync = false) {
    const user = await this.repository.findUserById(userId);
    if (!user?.stripeCustomerId) {
      return {
        synced: false,
        message: 'No Stripe customer linked',
        data: { customers: 0, subscriptions: 0, invoices: 0 },
      };
    }

    const customerId = user.stripeCustomerId;

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
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

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const invoices = await stripe.invoices.list({
      customer: customerId,
      status: 'paid',
      created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
      limit: 100,
    });

    const monthlyRevenue = invoices.data.reduce(
      (sum, inv) => sum + (inv.amount_paid || 0) / 100,
      0
    );

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await this.repository.upsertMonthlyFinance(
      userId,
      monthKey,
      monthlyRevenue,
      forceFullSync ? 'Full sync from Stripe' : 'Monthly sync from Stripe'
    );

    await this.repository.updateUser(userId, {
      mrr,
      arr: mrr * 12,
    });

    await this.repository.upsertFinanceSettings(userId, monthlyRevenue);
    await recalculateRunway(userId);

    return {
      synced: true,
      message: 'Sync Stripe terminé avec succès',
      data: {
        customers: 1,
        subscriptions: subscriptions.data.length,
        invoices: invoices.data.length,
        mrr,
        monthlyRevenue,
      },
    };
  }
}

export const billingService = new BillingService();
