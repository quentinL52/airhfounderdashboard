import { describe, it, expect } from 'vitest';
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
  ExpenseItem,
} from '../index';

describe('Finances Module - Domain Logic', () => {
  describe('MRR & ARR Formulas', () => {
    it('calculates MRR from Stripe monthly & yearly subscriptions correctly', () => {
      const subscriptions = [
        {
          items: {
            data: [
              { price: { recurring: { interval: 'month' }, unit_amount: 3000 }, quantity: 2 }, // 2 * $30 = $60/mo
              { price: { recurring: { interval: 'year' }, unit_amount: 12000 }, quantity: 1 }, // $120/yr = $10/mo
            ],
          },
        },
      ];

      const mrr = calculateMrrFromSubscriptions(subscriptions as any);
      expect(mrr).toBe(70); // 60 + 10 = 70
    });

    it('calculates ARR from MRR', () => {
      expect(calculateArr(100)).toBe(1200);
      expect(calculateArr(0)).toBe(0);
      expect(calculateArr(-50)).toBe(0);
    });

    it('calculates MRR from income entries', () => {
      const incomes: ExpenseItem[] = [
        { id: '1', label: 'Client A', amount: 100, frequency: 'monthly', type: 'income', category: 'Revenue' },
        { id: '2', label: 'Client B', amount: 1200, frequency: 'annual', type: 'income', category: 'Revenue' },
      ];

      const mrr = calculateMrrFromEntries(incomes);
      expect(mrr).toBe(200); // 100 + (1200 / 12) = 200
    });
  });

  describe('Cash Flow & Burn Rate', () => {
    it('groups entries into monthly buckets sorted descending', () => {
      const entries: ExpenseItem[] = [
        { id: '1', label: 'AWS', amount: 50, date: '2026-01-15', type: 'expense', category: 'Infrastructure' },
        { id: '2', label: 'Stripe Payout', amount: 500, date: '2026-02-01', type: 'income', category: 'Revenue' },
        { id: '3', label: 'OpenAI', amount: 30, date: '2026-02-10', type: 'expense', category: 'API IA' },
      ];

      const monthly = getMonthlyEntries(entries);
      expect(monthly).toHaveLength(2);
      expect(monthly[0].month).toBe('2026-02');
      expect(monthly[0].revenue).toBe(500);
      expect(monthly[0].expenses).toHaveLength(1);
      expect(monthly[1].month).toBe('2026-01');
      expect(monthly[1].expenses).toHaveLength(1);
    });

    it('calculates monthly burn rate taking frequency into account', () => {
      const expenses: ExpenseItem[] = [
        { id: '1', label: 'Server', amount: 100, frequency: 'monthly', type: 'expense', category: 'Infrastructure' },
        { id: '2', label: 'Domain', amount: 120, frequency: 'annual', type: 'expense', category: 'Infrastructure' },
      ];
      const incomes: ExpenseItem[] = [
        { id: '3', label: 'SaaS', amount: 50, frequency: 'monthly', type: 'income', category: 'Revenue' },
      ];

      // Expenses: 100 + (120/12) = 110. Incomes: 50. Burn = 110 - 50 = 60
      const burn = calculateMonthlyBurn(expenses, incomes);
      expect(burn).toBe(60);
    });

    it('calculates runway in months', () => {
      expect(calculateRunwayMonths(12000, 1000)).toBe('12.0');
      expect(calculateRunwayMonths(5000, 0)).toBe('∞');
      expect(calculateRunwayMonths(5000, -200)).toBe('∞');
      expect(calculateRunwayMonths(-100, 1000)).toBe('0.0');
    });

    it('calculates complete financial metrics for KPI dashboards', () => {
      const entries: ExpenseItem[] = [
        { id: '1', label: 'Hosting', amount: 200, frequency: 'monthly', type: 'expense', category: 'Infrastructure', date: '2026-07-01' },
        { id: '2', label: 'Sales', amount: 500, frequency: 'monthly', type: 'income', category: 'Revenue', date: '2026-07-01' },
      ];

      const metrics = calculateFinancialMetrics(entries, 10000);
      expect(metrics.cash).toBe(10000);
      expect(metrics.burn).toBe(0); // 200 expenses - 500 incomes <= 0
      expect(metrics.runway).toBe('∞');
      expect(metrics.revenue).toBe(500);
    });
  });

  describe('Expense Categories & Formatting', () => {
    it('normalizes category strings for DB storage', () => {
      expect(normalizeCategory('API IA')).toBe('API_IA');
      expect(normalizeCategory('Auth & Data')).toBe('Auth_&_Data');
    });

    it('formats category strings for UI display', () => {
      expect(formatCategoryLabel('API_IA')).toBe('API IA');
      expect(formatCategoryLabel('Auth_&_Data')).toBe('Auth & Data');
    });
  });
});
