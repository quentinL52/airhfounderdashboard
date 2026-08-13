import { ExpenseItem } from './financial-models';

/**
 * Calculates MRR (Monthly Recurring Revenue) from Stripe subscriptions list.
 */
export function calculateMrrFromSubscriptions(
  subscriptions: Array<{
    plan?: { amount?: number; interval?: string };
    items?: { data: Array<{ price?: { recurring?: { interval?: string }; unit_amount?: number }; quantity?: number }> };
  }>
): number {
  if (!subscriptions || !Array.isArray(subscriptions)) return 0;
  let totalMrr = 0;

  for (const sub of subscriptions) {
    // Handle standard Stripe subscription object format
    if (sub.items?.data && Array.isArray(sub.items.data)) {
      for (const item of sub.items.data) {
        const price = item.price;
        const quantity = item.quantity || 1;
        if (price?.recurring?.interval === 'month') {
          totalMrr += ((price.unit_amount || 0) / 100) * quantity;
        } else if (price?.recurring?.interval === 'year') {
          totalMrr += (((price.unit_amount || 0) / 100) * quantity) / 12;
        }
      }
    } else if (sub.plan && typeof sub.plan.amount === 'number') {
      // Handle simplified Composio/Stripe plan format
      if (sub.plan.interval === 'month') {
        totalMrr += sub.plan.amount / 100;
      } else if (sub.plan.interval === 'year') {
        totalMrr += (sub.plan.amount / 100) / 12;
      }
    }
  }

  return Math.max(0, totalMrr);
}

/**
 * Calculates ARR (Annual Recurring Revenue) from MRR.
 */
export function calculateArr(mrr: number): number {
  if (typeof mrr !== 'number' || isNaN(mrr) || mrr < 0) return 0;
  return mrr * 12;
}

/**
 * Calculates MRR from active income entries.
 */
export function calculateMrrFromEntries(incomes: ExpenseItem[]): number {
  if (!incomes || !Array.isArray(incomes)) return 0;
  return incomes.reduce((sum, item) => {
    if (item.frequency === 'monthly') {
      return sum + (item.amount || 0);
    }
    if (item.frequency === 'annual') {
      return sum + (item.amount || 0) / 12;
    }
    return sum;
  }, 0);
}
