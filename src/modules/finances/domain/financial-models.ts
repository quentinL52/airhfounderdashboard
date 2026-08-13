import { z } from 'zod';

export type ExpenseFrequency = 'monthly' | 'annual' | 'one-time' | 'one_time';
export type ExpenseType = 'expense' | 'income';

export interface ExpenseItem {
  id: string;
  label: string;
  amount: number;
  category: string;
  frequency?: ExpenseFrequency;
  type?: ExpenseType;
  date?: string | Date;
  notes?: string | null;
  monthlyFinanceId?: string | null;
}

export interface MonthlyFinance {
  id: string;
  month: string; // "YYYY-MM"
  revenue: number;
  expenses: ExpenseItem[];
  incomes: ExpenseItem[];
  notes?: string;
  updatedAt?: Date;
}

export interface FinanceSettings {
  userId: string;
  cashAvailable: number;
  targetMrr: number;
  firstRevenueDate?: Date | null;
  firstRevenueAmount?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FinanceOneTimeEntry {
  id: string;
  userId: string;
  label: string;
  amount: number;
  category: string;
  date: Date;
  notes?: string;
  createdAt?: Date;
}

export interface FinancialMetrics {
  cash: number;
  burn: number;
  revenue: number;
  runway: string;
  annualExpenses: number;
  mrr: number;
  arr: number;
}

export interface CSVFinanceRecord {
  date: string;
  label: string;
  amount: number;
  category: string;
  type?: ExpenseType;
  frequency?: ExpenseFrequency;
  notes?: string;
}

export interface CSVImportResult {
  success: boolean;
  importedCount: number;
  errors: string[];
  entries: Array<Omit<ExpenseItem, 'id'>>;
}

// Zod schemas for validation
export const financeActionSchema = z.object({
  action: z.enum([
    'updateSettings',
    'addEntry',
    'updateEntry',
    'deleteEntry',
    'addOneTimeEntry',
    'deleteOneTimeEntry',
  ]),
  payload: z.any(),
});

export const updateSettingsSchema = z.object({
  cashAvailable: z.number().optional(),
  targetMrr: z.number().optional(),
  firstRevenueDate: z.string().nullable().optional(),
  firstRevenueAmount: z.number().nullable().optional(),
});

export const entryPayloadSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Label is required'),
  amount: z.number(),
  category: z.string().min(1, 'Category is required'),
  frequency: z.enum(['monthly', 'annual', 'one-time']).optional().default('monthly'),
  type: z.enum(['expense', 'income']).optional().default('expense'),
  date: z.string().or(z.date()),
  notes: z.string().optional(),
});

export const csvRecordSchema = z.object({
  date: z.string().min(1),
  label: z.string().min(1),
  amount: z.coerce.number(),
  category: z.string().default('Divers'),
  type: z.enum(['expense', 'income']).optional().default('expense'),
  frequency: z.enum(['monthly', 'annual', 'one-time']).optional().default('monthly'),
  notes: z.string().optional(),
});
