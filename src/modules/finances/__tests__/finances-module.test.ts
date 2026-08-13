import { describe, it, expect, vi } from 'vitest';
import {
  calculateMrrFromSubscriptions,
  calculateArr,
  calculateMrrFromEntries,
  getMonthlyEntries,
  calculateMonthlyBurn,
  calculateRunwayMonths,
  calculateFinancialMetrics,
  normalizeCategory,
  formatCategoryLabel,
} from '../index';
import { CsvFinanceAdapter } from '../infrastructure/adapters/csv-finance-adapter';
import { MrrTrackingService } from '../application/mrr-tracking-service';
import { ExpenseItem } from '../domain/financial-models';

describe('Finances Module - Domain & Application Tests', () => {
  describe('MRR & ARR Domain Formulas', () => {
    it('calculates MRR from Stripe subscription items correctly', () => {
      const subscriptions = [
        {
          items: {
            data: [
              { price: { recurring: { interval: 'month' }, unit_amount: 5000 }, quantity: 2 }, // $100/mo
              { price: { recurring: { interval: 'year' }, unit_amount: 12000 }, quantity: 1 }, // $10/mo
            ],
          },
        },
      ];

      const mrr = calculateMrrFromSubscriptions(subscriptions);
      expect(mrr).toBe(110);
    });

    it('calculates ARR from MRR', () => {
      expect(calculateArr(100)).toBe(12000 / 10);
      expect(calculateArr(0)).toBe(0);
      expect(calculateArr(-50)).toBe(0);
    });

    it('calculates MRR from income expense items', () => {
      const incomes: ExpenseItem[] = [
        { id: '1', label: 'Client A', amount: 500, category: 'income', frequency: 'monthly', type: 'income' },
        { id: '2', label: 'Client B', amount: 1200, category: 'income', frequency: 'annual', type: 'income' },
        { id: '3', label: 'One time consulting', amount: 1000, category: 'income', frequency: 'one-time', type: 'income' },
      ];

      const mrr = calculateMrrFromEntries(incomes);
      expect(mrr).toBe(600); // 500 + 100
    });
  });

  describe('Cashflow & Runway Calculations', () => {
    it('aggregates raw entries into monthly buckets sorted desc', () => {
      const entries: ExpenseItem[] = [
        { id: '1', label: 'Server', amount: 50, category: 'Infrastructure', type: 'expense', date: '2026-06-15' },
        { id: '2', label: 'SaaS sale', amount: 300, category: 'revenue', type: 'income', date: '2026-07-01' },
        { id: '3', label: 'DB', amount: 30, category: 'Infrastructure', type: 'expense', date: '2026-07-10' },
      ];

      const monthly = getMonthlyEntries(entries);
      expect(monthly.length).toBe(2);
      expect(monthly[0].month).toBe('2026-07');
      expect(monthly[0].revenue).toBe(300);
      expect(monthly[0].expenses.length).toBe(1);
      expect(monthly[1].month).toBe('2026-06');
    });

    it('calculates monthly burn rate', () => {
      const expenses: ExpenseItem[] = [
        { id: '1', label: 'Hosting', amount: 100, category: 'Infra', frequency: 'monthly', type: 'expense' },
        { id: '2', label: 'Domain', amount: 120, category: 'Infra', frequency: 'annual', type: 'expense' },
      ];
      const incomes: ExpenseItem[] = [
        { id: '3', label: 'SaaS', amount: 50, category: 'Revenue', frequency: 'monthly', type: 'income' },
      ];

      const burn = calculateMonthlyBurn(expenses, incomes);
      expect(burn).toBe(60); // (100 + 10) - 50 = 60
    });

    it('calculates runway months', () => {
      expect(calculateRunwayMonths(1200, 100)).toBe('12.0');
      expect(calculateRunwayMonths(500, 0)).toBe('∞');
      expect(calculateRunwayMonths(-100, 50)).toBe('0.0');
    });

    it('calculates financial metrics for dashboard', () => {
      const entries: ExpenseItem[] = [
        { id: '1', label: 'Cloud', amount: 200, category: 'Infra', frequency: 'monthly', type: 'expense', date: '2026-07-01' },
        { id: '2', label: 'MRR Plan', amount: 500, category: 'Revenue', frequency: 'monthly', type: 'income', date: '2026-07-01' },
      ];

      const metrics = calculateFinancialMetrics(entries, 10000);
      expect(metrics.cash).toBe(10000);
      expect(metrics.burn).toBe(0); // Incomes > expenses
      expect(metrics.mrr).toBe(500);
      expect(metrics.arr).toBe(6000);
    });
  });

  describe('Expense Categories & Normalization', () => {
    it('normalizes categories for storage', () => {
      expect(normalizeCategory('API IA')).toBe('API_IA');
      expect(normalizeCategory('Auth & Data')).toBe('Auth_&_Data');
      expect(normalizeCategory('')).toBe('Divers');
    });

    it('formats categories back to display labels', () => {
      expect(formatCategoryLabel('API_IA')).toBe('API IA');
      expect(formatCategoryLabel('Auth_&_Data')).toBe('Auth & Data');
    });
  });

  describe('CSV Finance Adapter', () => {
    const adapter = new CsvFinanceAdapter();

    it('parses valid CSV string into financial entries', () => {
      const csv = `Date,Label,Amount,Category,Type,Frequency,Notes
2026-07-01,Stripe Sub,150,Revenue,income,monthly,Main customer
2026-07-05,AWS EC2,45,Infrastructure,expense,monthly,Cloud server`;

      const result = adapter.parseFinancesCSV(csv);
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);
      expect(result.entries[0].label).toBe('Stripe Sub');
      expect(result.entries[0].type).toBe('income');
      expect(result.entries[1].amount).toBe(45);
      expect(result.entries[1].category).toBe('Infrastructure');
    });

    it('handles empty or malformed CSV input gracefully', () => {
      const emptyResult = adapter.parseFinancesCSV('');
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.errors.length).toBeGreaterThan(0);
    });

    it('exports financial entries to CSV string format', () => {
      const entries: ExpenseItem[] = [
        {
          id: '1',
          label: 'Vercel Pro',
          amount: 20,
          category: 'Infrastructure',
          type: 'expense',
          frequency: 'monthly',
          date: '2026-07-01',
          notes: 'Hosting',
        },
      ];

      const csv = adapter.exportFinancesCSV(entries);
      expect(csv).toContain('Vercel Pro');
      expect(csv).toContain('Infrastructure');
      expect(csv).toContain('20');
    });
  });

  describe('MRR Tracking Service', () => {
    it('calculates MRR & ARR from income list', () => {
      const service = new MrrTrackingService({} as any);
      const incomes: ExpenseItem[] = [
        { id: '1', label: 'Sub A', amount: 100, category: 'income', frequency: 'monthly', type: 'income' },
      ];

      const result = service.calculateMrrFromIncomes(incomes);
      expect(result.mrr).toBe(100);
      expect(result.arr).toBe(1200);
    });
  });
});
