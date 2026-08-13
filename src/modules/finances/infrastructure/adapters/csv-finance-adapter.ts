import { parse } from 'csv-parse/sync';
import { ExpenseItem, CSVImportResult, csvRecordSchema } from '../../domain/financial-models';
import { normalizeCategory } from '../../domain/expense-types';
import { financeRepository, PrismaFinanceRepository } from '../prisma-finance-repository';

export class CsvFinanceAdapter {
  constructor(private repo: PrismaFinanceRepository = financeRepository) {}

  /**
   * Parses raw CSV content into financial entries.
   */
  parseFinancesCSV(csvContent: string): CSVImportResult {
    const errors: string[] = [];
    const entries: Array<Omit<ExpenseItem, 'id'>> = [];

    if (!csvContent || csvContent.trim().length === 0) {
      return { success: false, importedCount: 0, errors: ['CSV content is empty'], entries: [] };
    }

    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (!Array.isArray(records) || records.length === 0) {
        return { success: false, importedCount: 0, errors: ['No valid rows found in CSV'], entries: [] };
      }

      records.forEach((row: any, index: number) => {
        try {
          const rawDate = row.Date || row.date || row.DateTransaction || new Date().toISOString().split('T')[0];
          const rawLabel = row.Label || row.label || row.Description || row.description || `Entry ${index + 1}`;
          const rawAmount = row.Amount || row.amount || row.Montant || row.montant || 0;
          const rawCategory = row.Category || row.category || row.Categorie || 'Divers';
          const rawType = (row.Type || row.type || 'expense').toLowerCase();
          const rawFrequency = (row.Frequency || row.frequency || row.Frequence || 'monthly').toLowerCase();
          const rawNotes = row.Notes || row.notes || row.Commentaire || '';

          const amountVal = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount).replace(',', '.'));
          if (isNaN(amountVal)) {
            errors.push(`Row ${index + 1}: Invalid amount "${rawAmount}"`);
            return;
          }

          const parsed = csvRecordSchema.safeParse({
            date: rawDate,
            label: rawLabel,
            amount: amountVal,
            category: normalizeCategory(rawCategory),
            type: rawType === 'income' || rawType === 'revenue' || rawType === 'revenu' ? 'income' : 'expense',
            frequency: rawFrequency === 'annual' || rawFrequency === 'annuel' ? 'annual' : rawFrequency === 'one-time' || rawFrequency === 'ponctuel' ? 'one-time' : 'monthly',
            notes: rawNotes,
          });

          if (!parsed.success) {
            errors.push(`Row ${index + 1}: ${parsed.error.errors.map((e) => e.message).join(', ')}`);
            return;
          }

          entries.push({
            label: parsed.data.label,
            amount: parsed.data.amount,
            category: parsed.data.category,
            type: parsed.data.type,
            frequency: parsed.data.frequency,
            date: parsed.data.date,
            notes: parsed.data.notes,
          });
        } catch (err: any) {
          errors.push(`Row ${index + 1}: ${err.message || 'Malformed row'}`);
        }
      });

      return {
        success: entries.length > 0,
        importedCount: entries.length,
        errors,
        entries,
      };
    } catch (e: any) {
      return {
        success: false,
        importedCount: 0,
        errors: [`CSV Parsing failure: ${e.message}`],
        entries: [],
      };
    }
  }

  /**
   * Imports CSV content directly into Prisma DB for a user.
   */
  async importUserFinancesCSV(userId: string, csvContent: string): Promise<CSVImportResult> {
    const parseResult = this.parseFinancesCSV(csvContent);
    if (!parseResult.success || parseResult.entries.length === 0) {
      return parseResult;
    }

    let persistedCount = 0;
    const errors = [...parseResult.errors];

    for (let i = 0; i < parseResult.entries.length; i++) {
      const item = parseResult.entries[i];
      try {
        const itemDate = new Date(item.date || new Date());
        await this.repo.addEntry(userId, {
          label: item.label,
          amount: item.amount,
          category: item.category,
          frequency: item.frequency,
          type: item.type,
          date: itemDate,
          notes: item.notes || undefined,
        });
        persistedCount++;
      } catch (err: any) {
        errors.push(`Entry "${item.label}": ${err.message || 'Failed to save to database'}`);
      }
    }

    return {
      success: persistedCount > 0,
      importedCount: persistedCount,
      errors,
      entries: parseResult.entries,
    };
  }

  /**
   * Exports user financial entries to CSV string format.
   */
  exportFinancesCSV(entries: ExpenseItem[]): string {
    const headers = ['Date', 'Label', 'Amount', 'Category', 'Type', 'Frequency', 'Notes'];
    const rows = entries.map((e) => {
      const d = e.date ? new Date(e.date).toISOString().split('T')[0] : '';
      const label = `"${(e.label || '').replace(/"/g, '""')}"`;
      const amount = e.amount;
      const category = `"${(e.category || '').replace(/"/g, '""')}"`;
      const type = e.type || 'expense';
      const frequency = e.frequency || 'monthly';
      const notes = `"${(e.notes || '').replace(/"/g, '""')}"`;
      return [d, label, amount, category, type, frequency, notes].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

export const csvFinanceAdapter = new CsvFinanceAdapter();
