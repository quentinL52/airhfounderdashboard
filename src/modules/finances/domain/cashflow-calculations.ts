import { ExpenseItem, MonthlyFinance, FinancialMetrics } from './financial-models';
import { calculateMrrFromEntries, calculateArr } from './mrr-formulas';

/**
 * Aggregates raw expense/income items into monthly buckets ("YYYY-MM").
 */
export function getMonthlyEntries(entries: ExpenseItem[]): MonthlyFinance[] {
  if (!entries || !Array.isArray(entries)) return [];
  const monthlyMap: Record<string, MonthlyFinance> = {};

  entries.forEach((entry) => {
    if (!entry.date) return;
    const date = new Date(entry.date);
    if (isNaN(date.getTime())) return;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `month-${monthKey}`,
        month: monthKey,
        revenue: 0,
        expenses: [],
        incomes: [],
      };
    }

    if (entry.type === 'expense') {
      monthlyMap[monthKey].expenses.push(entry);
    } else if (entry.type === 'income') {
      monthlyMap[monthKey].incomes.push(entry);
      monthlyMap[monthKey].revenue += entry.amount;
    }
  });

  return Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * Calculates recurring monthly burn rate from active expenses and incomes.
 */
export function calculateMonthlyBurn(expenses: ExpenseItem[], incomes: ExpenseItem[] = []): number {
  const recurringExpenses = (expenses || []).reduce((sum, e) => {
    if (e.frequency === 'annual') return sum + (e.amount || 0) / 12;
    if (e.frequency === 'monthly' || !e.frequency) return sum + (e.amount || 0);
    return sum;
  }, 0);

  const recurringIncomes = (incomes || []).reduce((sum, i) => {
    if (i.frequency === 'annual') return sum + (i.amount || 0) / 12;
    if (i.frequency === 'monthly' || !i.frequency) return sum + (i.amount || 0);
    return sum;
  }, 0);

  const burn = recurringExpenses - recurringIncomes;
  return burn > 0 ? burn : 0;
}

/**
 * Calculates runway in months based on available cash and monthly burn rate.
 */
export function calculateRunwayMonths(cashAvailable: number, monthlyBurn: number): string {
  if (cashAvailable < 0) return '0.0';
  if (monthlyBurn <= 0) return '∞';
  return (cashAvailable / monthlyBurn).toFixed(1);
}

/**
 * Calculates complete financial metrics for KPI dashboard.
 */
export function calculateFinancialMetrics(entries: ExpenseItem[], cashAvailable: number): FinancialMetrics {
  const monthlyList = getMonthlyEntries(entries);
  const latestEntry = monthlyList[0];

  const expenses = latestEntry?.expenses || [];
  const incomes = latestEntry?.incomes || [];

  const burn = calculateMonthlyBurn(expenses, incomes);
  const revenue = (incomes || []).reduce((sum, i) => {
    if (i.frequency === 'annual') return sum + (i.amount || 0) / 12;
    if (i.frequency === 'monthly' || !i.frequency) return sum + (i.amount || 0);
    return sum;
  }, 0);

  const recurringExpenses = (expenses || []).reduce((sum, e) => {
    if (e.frequency === 'annual') return sum + (e.amount || 0) / 12;
    if (e.frequency === 'monthly' || !e.frequency) return sum + (e.amount || 0);
    return sum;
  }, 0);

  const runway = calculateRunwayMonths(cashAvailable, burn);
  const mrr = calculateMrrFromEntries(incomes);
  const arr = calculateArr(mrr);

  return {
    cash: cashAvailable || 0,
    burn,
    revenue,
    runway,
    annualExpenses: recurringExpenses * 12,
    mrr,
    arr,
  };
}
