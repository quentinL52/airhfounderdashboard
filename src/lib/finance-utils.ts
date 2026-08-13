/**
 * Re-export finance domain models and calculations for backward compatibility.
 * Core implementations live in `src/modules/finances/domain/`.
 */
export {
  getMonthlyEntries,
  calculateMonthlyBurn,
  calculateRunwayMonths,
  calculateFinancialMetrics,
} from '@/modules/finances/domain/cashflow-calculations';

export type {
  ExpenseItem,
  MonthlyFinance,
  FinanceSettings,
  FinanceOneTimeEntry,
  FinancialMetrics,
} from '@/modules/finances/domain/financial-models';
