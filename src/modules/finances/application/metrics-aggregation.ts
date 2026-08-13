import { ExpenseItem, FinancialMetrics } from '../domain/financial-models';
import { calculateFinancialMetrics, calculateMonthlyBurn } from '../domain/cashflow-calculations';
import { financeRepository } from '../infrastructure/prisma-finance-repository';

export class MetricsAggregationService {
  /**
   * Calculates comprehensive metrics from raw financial state.
   */
  aggregateMetrics(entries: ExpenseItem[], cashAvailable: number): FinancialMetrics {
    return calculateFinancialMetrics(entries, cashAvailable);
  }

  /**
   * Recalculates and updates runway settings in DB for a user based on historical burn.
   */
  async recalculateUserRunway(userId: string): Promise<void> {
    const settings = await financeRepository.getSettings(userId);
    const expenses = await financeRepository.getEntries(userId);

    const expenseList = expenses.filter((e) => e.type === 'expense');

    const monthlyBurn =
      expenseList.length > 0
        ? expenseList.reduce((sum, e) => sum + e.amount, 0) /
          Math.max(1, Math.min(6, new Set(expenseList.map((e) => new Date(e.date).getMonth())).size))
        : 0;

    const cashAvailable = settings?.cashAvailable || 0;

    await financeRepository.upsertSettings(userId, {
      cashAvailable,
    });
  }
}

export const metricsAggregationService = new MetricsAggregationService();
