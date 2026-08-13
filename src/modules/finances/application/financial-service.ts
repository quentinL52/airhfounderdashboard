import { financeRepository } from '../infrastructure/prisma-finance-repository';
import { stripeSyncAdapter } from '../infrastructure/adapters/stripe-sync-adapter';
import { csvFinanceAdapter } from '../infrastructure/adapters/csv-finance-adapter';
import { metricsAggregationService } from './metrics-aggregation';
import { transactionProcessingService } from './transaction-processing';
import { mrrTrackingService } from './mrr-tracking-service';

export class FinancialService {
  /**
   * Fetches full financial data for a user (settings, entries, one-time entries).
   */
  async getFinancialOverview(userId: string) {
    const [settings, entries, oneTimeEntries] = await Promise.all([
      financeRepository.getSettings(userId),
      financeRepository.getEntries(userId),
      financeRepository.getOneTimeEntries(userId),
    ]);

    return {
      settings: settings || { cashAvailable: 0, targetMrr: 0 },
      entries,
      oneTimeEntries,
    };
  }

  /**
   * Processes financial action payloads (add, update, delete entries/settings).
   */
  async processFinancialAction(userId: string, action: string, payload: any) {
    return transactionProcessingService.processAction(userId, action, payload);
  }

  /**
   * Recalculates runway for a user.
   */
  async recalculateRunway(userId: string) {
    return metricsAggregationService.recalculateUserRunway(userId);
  }

  /**
   * Triggers Stripe data synchronization for a user.
   */
  async syncStripeFinances(userId: string, options?: { forceFullSync?: boolean }) {
    return stripeSyncAdapter.syncUserStripeData(userId, options);
  }

  /**
   * Retrieves user MRR tracking overview.
   */
  async getMrrOverview(userId: string) {
    return mrrTrackingService.getMrrOverview(userId);
  }

  /**
   * Imports CSV content directly into user finances.
   */
  async importFinancesCSV(userId: string, csvContent: string) {
    return csvFinanceAdapter.importUserFinancesCSV(userId, csvContent);
  }

  /**
   * Exports user financial entries to CSV string format.
   */
  async exportFinancesCSV(userId: string): Promise<string> {
    const entries = await financeRepository.getEntries(userId);
    return csvFinanceAdapter.exportFinancesCSV(entries as any);
  }
}

export const financialService = new FinancialService();
