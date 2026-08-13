import { prisma } from '@/lib/prisma';
import { FinanceSettings, ExpenseItem, FinanceOneTimeEntry, MonthlyFinance } from '../domain/financial-models';
import { normalizeCategory } from '../domain/expense-types';

export class PrismaFinanceRepository {
  async getSettings(userId: string) {
    const settings = await prisma.financeSettings.findUnique({ where: { userId } });
    return settings || { userId, cashAvailable: 0, targetMrr: 0 };
  }

  async upsertSettings(
    userId: string,
    data: {
      cashAvailable?: number;
      targetMrr?: number;
      firstRevenueDate?: Date | null;
      firstRevenueAmount?: number | null;
    }
  ) {
    return prisma.financeSettings.upsert({
      where: { userId },
      update: {
        ...(data.cashAvailable !== undefined && { cashAvailable: data.cashAvailable }),
        ...(data.targetMrr !== undefined && { targetMrr: data.targetMrr }),
        firstRevenueDate: data.firstRevenueDate,
        firstRevenueAmount: data.firstRevenueAmount,
        updatedAt: new Date(),
      },
      create: {
        userId,
        cashAvailable: data.cashAvailable ?? 0,
        targetMrr: data.targetMrr ?? 0,
        firstRevenueDate: data.firstRevenueDate,
        firstRevenueAmount: data.firstRevenueAmount,
      },
    });
  }

  async getEntries(userId: string) {
    return prisma.financeEntry.findMany({ where: { userId } });
  }

  async getOneTimeEntries(userId: string) {
    return prisma.financeOneTimeEntry.findMany({ where: { userId } });
  }

  async getMonthlyFinances(userId: string, limit = 24) {
    return prisma.monthlyFinance.findMany({
      where: { userId },
      orderBy: { month: 'desc' },
      take: limit,
      include: { entries: true },
    });
  }

  async findOrCreateMonthlyFinance(userId: string, monthStr: string) {
    let monthly = await prisma.monthlyFinance.findUnique({
      where: { userId_month: { userId, month: monthStr } },
    });

    let isNew = false;
    if (!monthly) {
      monthly = await prisma.monthlyFinance.create({
        data: { userId, month: monthStr, revenue: 0 },
      });
      isNew = true;
    }

    return { monthly, isNew };
  }

  async upsertMonthlyFinanceRevenue(userId: string, monthStr: string, revenue: number, notes?: string) {
    return prisma.monthlyFinance.upsert({
      where: { userId_month: { userId, month: monthStr } },
      create: { userId, month: monthStr, revenue, notes },
      update: { revenue, notes, updatedAt: new Date() },
    });
  }

  async addEntry(
    userId: string,
    data: {
      id?: string;
      label: string;
      amount: number;
      category: string;
      frequency?: string;
      type?: string;
      date: Date;
      notes?: string;
    }
  ) {
    const monthStr = `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, '0')}`;
    const { monthly, isNew } = await this.findOrCreateMonthlyFinance(userId, monthStr);

    const category = normalizeCategory(data.category);

    const entry = await prisma.financeEntry.create({
      data: {
        id: data.id,
        userId,
        monthlyFinanceId: monthly.id,
        label: data.label,
        amount: data.amount,
        category: category as any,
        frequency: (data.frequency || 'monthly') as any,
        type: (data.type || 'expense') as any,
        date: data.date,
        notes: data.notes,
      },
    });

    return { entry, isNewMonthly: isNew };
  }

  async updateEntry(
    userId: string,
    data: {
      id: string;
      label?: string;
      amount?: number;
      category?: string;
      frequency?: string;
      type?: string;
      date?: Date;
      notes?: string;
    }
  ) {
    const category = data.category ? normalizeCategory(data.category) : undefined;

    return prisma.financeEntry.update({
      where: { id: data.id, userId },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(category !== undefined && { category: category as any }),
        ...(data.frequency !== undefined && { frequency: data.frequency as any }),
        ...(data.type !== undefined && { type: data.type as any }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async deleteEntry(userId: string, id: string) {
    return prisma.financeEntry.delete({
      where: { id, userId },
    });
  }

  async addOneTimeEntry(
    userId: string,
    data: {
      id?: string;
      label: string;
      amount: number;
      category: string;
      date: Date;
      notes?: string;
    }
  ) {
    return prisma.financeOneTimeEntry.create({
      data: {
        id: data.id,
        userId,
        label: data.label,
        amount: data.amount,
        category: data.category,
        date: data.date,
        notes: data.notes,
      },
    });
  }

  async deleteOneTimeEntry(userId: string, id: string) {
    return prisma.financeOneTimeEntry.delete({
      where: { id, userId },
    });
  }
}

export const financeRepository = new PrismaFinanceRepository();
