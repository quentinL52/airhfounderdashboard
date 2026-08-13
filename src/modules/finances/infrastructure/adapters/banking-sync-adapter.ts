export interface BankTransaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  date: Date;
  type: 'income' | 'expense';
}

export interface BankSyncResult {
  success: boolean;
  syncedTransactionsCount: number;
  errors?: string[];
}

export class BankingSyncAdapter {
  /**
   * Abstract / pluggable banking sync method.
   * Can be extended for Plaid, GoCardless, Bridge API, or CSV import parsers.
   */
  async syncBankTransactions(userId: string, provider: string): Promise<BankSyncResult> {
    // Adapter interface ready for banking providers
    return {
      success: true,
      syncedTransactionsCount: 0,
      errors: [],
    };
  }
}

export const bankingSyncAdapter = new BankingSyncAdapter();
