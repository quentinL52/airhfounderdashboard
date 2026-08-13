import { GamificationService, XP_RULES } from '@/services/gamification.service';
import { financeRepository } from '../infrastructure/prisma-finance-repository';
import { entryPayloadSchema, updateSettingsSchema } from '../domain/financial-models';

export class TransactionProcessingService {
  async processAction(userId: string, action: string, payload: any) {
    let gamificationResult = null;

    switch (action) {
      case 'updateSettings': {
        const validatedSettings = updateSettingsSchema.parse(payload);
        await financeRepository.upsertSettings(userId, {
          cashAvailable: validatedSettings.cashAvailable,
          targetMrr: validatedSettings.targetMrr,
          firstRevenueDate: validatedSettings.firstRevenueDate ? new Date(validatedSettings.firstRevenueDate) : null,
          firstRevenueAmount: validatedSettings.firstRevenueAmount,
        });
        gamificationResult = await GamificationService.addXp(userId, XP_RULES.FINANCE_SETTINGS_UPDATED);
        break;
      }

      case 'addEntry': {
        const validatedEntry = entryPayloadSchema.parse(payload);
        const date = new Date(validatedEntry.date);

        const { isNewMonthly } = await financeRepository.addEntry(userId, {
          id: validatedEntry.id,
          label: validatedEntry.label,
          amount: validatedEntry.amount,
          category: validatedEntry.category,
          frequency: validatedEntry.frequency,
          type: validatedEntry.type,
          date,
          notes: validatedEntry.notes,
        });

        if (isNewMonthly) {
          gamificationResult = await GamificationService.addXp(userId, 25);
        } else {
          gamificationResult = await GamificationService.addXp(userId, XP_RULES.FINANCE_ENTRY_ADDED);
        }
        break;
      }

      case 'updateEntry': {
        const validatedEntry = entryPayloadSchema.partial().parse(payload);
        if (!validatedEntry.id) throw new Error('Entry ID required for update');

        await financeRepository.updateEntry(userId, {
          id: validatedEntry.id,
          label: validatedEntry.label,
          amount: validatedEntry.amount,
          category: validatedEntry.category,
          frequency: validatedEntry.frequency,
          type: validatedEntry.type,
          date: validatedEntry.date ? new Date(validatedEntry.date) : undefined,
          notes: validatedEntry.notes,
        });
        break;
      }

      case 'deleteEntry': {
        if (!payload?.id) throw new Error('Entry ID required for deletion');
        await financeRepository.deleteEntry(userId, payload.id);
        break;
      }

      case 'addOneTimeEntry': {
        await financeRepository.addOneTimeEntry(userId, {
          id: payload.id,
          label: payload.label,
          amount: payload.amount,
          category: payload.category,
          date: new Date(payload.date),
          notes: payload.notes,
        });
        gamificationResult = await GamificationService.addXp(userId, XP_RULES.FINANCE_ENTRY_ADDED);
        break;
      }

      case 'deleteOneTimeEntry': {
        if (!payload?.id) throw new Error('One-time entry ID required for deletion');
        await financeRepository.deleteOneTimeEntry(userId, payload.id);
        break;
      }

      default:
        throw new Error(`Invalid action: ${action}`);
    }

    return { ok: true, gamification: gamificationResult };
  }
}

export const transactionProcessingService = new TransactionProcessingService();
