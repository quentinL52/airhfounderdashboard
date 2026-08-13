import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/billing/stripe-client';
import { logger } from '@/lib/logging/logger';
import { calculateMrrFromSubscriptions, calculateArr } from '../../domain/mrr-formulas';
import { financeRepository } from '../prisma-finance-repository';

export interface StripeSyncResult {
  success: boolean;
  mrr: number;
  monthlyRevenue?: number;
  synced?: {
    customers: number;
    subscriptions: number;
    invoices: number;
    mrr: number;
    monthlyRevenue: number;
  };
  message?: string;
}

export class StripeSyncAdapter {
  /**
   * Synchronizes Stripe subscriptions and invoices for a user by user ID.
   */
  async syncUserStripeData(userId: string, options?: { forceFullSync?: boolean }): Promise<StripeSyncResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return {
        success: true,
        mrr: 0,
        message: 'No Stripe customer linked',
        synced: { customers: 0, subscriptions: 0, invoices: 0, mrr: 0, monthlyRevenue: 0 },
      };
    }

    const customerId = user.stripeCustomerId;

    // 1. Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });

    // 2. Calculate MRR & ARR using domain formulas
    const mrr = calculateMrrFromSubscriptions(subscriptions.data as any);
    const arr = calculateArr(mrr);

    // 3. Fetch paid invoices for current month
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
      (sum: number, inv: { amount_paid?: number }) => sum + (inv.amount_paid || 0) / 100,
      0
    );

    // 4. Update monthly finance
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const notes = options?.forceFullSync ? 'Full sync from Stripe' : 'Monthly sync from Stripe';

    await financeRepository.upsertMonthlyFinanceRevenue(userId, monthKey, monthlyRevenue, notes);

    // 5. Update user MRR/ARR
    await prisma.user.update({
      where: { id: userId },
      data: { mrr, arr },
    });

    // 6. Upsert finance settings
    await prisma.financeSettings.upsert({
      where: { userId },
      create: { userId, cashAvailable: monthlyRevenue },
      update: { updatedAt: new Date() },
    });

    return {
      success: true,
      mrr,
      monthlyRevenue,
      synced: {
        customers: 1,
        subscriptions: subscriptions.data.length,
        invoices: invoices.data.length,
        mrr,
        monthlyRevenue,
      },
    };
  }

  /**
   * Sync Stripe MRR via Composio tool for fallback / manual integrations.
   */
  async syncMrrViaComposio(userId: string): Promise<{ success: boolean; mrr: number }> {
    let subscriptions: any;

    try {
      const { executeComposioTool } = await import('@/lib/integrations/composio-client');
      const result = await executeComposioTool('stripe_list_subscriptions', { status: 'active' }, userId);
      subscriptions = result.data;
    } catch (e: any) {
      logger.warn('[Stripe Sync] Composio error (user may not be connected)', { userId, message: e.message });
      subscriptions = { data: [] };
    }

    const totalMRR = calculateMrrFromSubscriptions(subscriptions?.data || []);

    await financeRepository.addOneTimeEntry(userId, {
      amount: totalMRR || 0,
      category: 'mrr-snapshot',
      label: 'Synchronisation Stripe MRR',
      date: new Date(),
    });

    return { success: true, mrr: totalMRR };
  }
}

export const stripeSyncAdapter = new StripeSyncAdapter();
