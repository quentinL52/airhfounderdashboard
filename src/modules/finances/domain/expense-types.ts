import { designTokens } from '@/lib/design-tokens';

export const EXPENSE_CATEGORIES = [
  'Infrastructure',
  'API IA',
  'Auth & Data',
  'Observabilité',
  'Email',
  'Outils SaaS',
  'Marketing',
  'Divers',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number] | string;

export const CATEGORY_COLORS: Record<string, string> = {
  Infrastructure: designTokens.colors.primary,
  'API IA': designTokens.colors.primaryLight,
  'Auth & Data': designTokens.colors.status.success.text,
  Observabilité: designTokens.colors.status.warning.text,
  Email: designTokens.colors.status.danger.text,
  'Outils SaaS': designTokens.colors.status.neutral.text,
  Marketing: designTokens.colors.cta.bg,
  Divers: '#64748b',
  other: '#64748b',
};

/**
 * Normalizes category string to replace spaces with underscores when saving to DB if needed.
 */
export function normalizeCategory(category: string): string {
  if (!category) return 'Divers';
  if (typeof category === 'string') {
    return category.replace(/ /g, '_');
  }
  return category;
}

/**
 * Converts stored category (e.g. API_IA) back to display label (API IA).
 */
export function formatCategoryLabel(category: string): string {
  if (!category) return 'Divers';
  return category.replace(/_/g, ' ');
}
