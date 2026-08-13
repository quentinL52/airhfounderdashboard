import { ExpenseItem } from '../domain/financial-models';
import { calculateMrrFromEntries, calculateArr } from '../domain/mrr-formulas';
import type { StripeSyncResult } from '../infrastructure/adapters/stripe-sync-adapter';
import { financeRepository, PrismaFinanceRepository } from '../infrastructure/prisma-finance-repository';

export interface MrrTrackingOverview {
  mrr: number;
  arr: number;
  targetMrr: number;
  progressToTargetPercent: number;
  monthlyRevenue: number;
}

export class MrrTrackingService {
  constructor(private repo: PrismaFinanceRepository = financeRepository) {}

  /**
   * Calculates current MRR & ARR metrics from user's active incomes.
   */
  calculateMrrFromIncomes(incomes: ExpenseItem[]) {
    const mrr = calculateMrrFromEntries(incomes);
    const arr = calculateArr(mrr);
    return { mrr, arr };
  }

  /**
   * Retrieves full MRR tracking overview including target MRR and progress.
   */
  async getMrrOverview(userId: string): Promise<MrrTrackingOverview> {
    const [settings, entries, monthlyFinances] = await Promise.all([
      this.repo.getSettings(userId),
      this.repo.getEntries(userId),
      this.repo.getMonthlyFinances(userId, 1),
    ]);

    const incomes = entries.filter((e) => e.type === 'income');
    const { mrr, arr } = this.calculateMrrFromIncomes(incomes);

    const targetMrr = settings?.targetMrr || 0;
    const progressToTargetPercent = targetMrr > 0 ? Math.min(100, (mrr / targetMrr) * 100) : 0;
    const monthlyRevenue = monthlyFinances[0]?.revenue || 0;

    return {
      mrr,
      arr,
      targetMrr,
      progressToTargetPercent,
      monthlyRevenue,
    };
  }

  /**
   * Triggers Stripe MRR synchronization for user.
   */
  async syncStripeMrr(userId: string, options?: { forceFullSync?: boolean }): Promise<StripeSyncResult> {
    const { stripeSyncAdapter } = await import('../infrastructure/adapters/stripe-sync-adapter');
    return stripeSyncAdapter.syncUserStripeData(userId, options);
  }
}

export const mrrTrackingService = new MrrTrackingService();
