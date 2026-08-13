import { prisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import { PRICING_CONFIG, type PlanStatus, type PlanType } from '../domain/types';

type PrismaTx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class SubscriptionRepository {
  async findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async findUserByStripeCustomerId(stripeCustomerId: string) {
    return prisma.user.findFirst({
      where: { stripeCustomerId },
    });
  }

  async updateUser(userId: string, data: any) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async isFounderDealAvailable(tx?: PrismaTx): Promise<boolean> {
    const db = tx || prisma;
    const counter = await db.founderDealCounter.findUnique({ where: { id: 'singleton' } });
    if (!counter) return true;
    return counter.sold < PRICING_CONFIG.founderDeal.maxUsers;
  }

  async reserveFounderSeat(tx?: PrismaTx): Promise<boolean> {
    const db = tx || prisma;
    const max = PRICING_CONFIG.founderDeal.maxUsers;

    await db.$executeRawUnsafe(`
      INSERT INTO founder_deal_counter (id, sold, total, updated_at)
      VALUES ('singleton', 0, 0, NOW())
      ON CONFLICT (id) DO NOTHING
    `);

    const updated: number = await db.$executeRawUnsafe(
      `UPDATE founder_deal_counter SET sold = sold + 1, updated_at = NOW() WHERE id = 'singleton' AND sold < $1`,
      max,
    );
    return updated === 1;
  }

  async releaseFounderSeat(tx?: PrismaTx): Promise<void> {
    const db = tx || prisma;
    await db.$executeRawUnsafe(
      `UPDATE founder_deal_counter SET sold = GREATEST(sold - 1, 0), updated_at = NOW() WHERE id = 'singleton'`,
    );
  }

  async getFounderSeatsLeft(tx?: PrismaTx): Promise<number> {
    const db = tx || prisma;
    const counter = await db.founderDealCounter.findUnique({ where: { id: 'singleton' } });
    if (!counter) return PRICING_CONFIG.founderDeal.maxUsers;
    return Math.max(0, PRICING_CONFIG.founderDeal.maxUsers - counter.sold);
  }

  async getFounderDealCounter(tx?: PrismaTx) {
    const db = tx || prisma;
    return db.founderDealCounter.findUnique({ where: { id: 'singleton' } });
  }

  async createSeatReservation(data: { userId: string; cohort: string; sessionId: string; expiresAt: Date }, tx?: PrismaTx) {
    const db = tx || prisma;
    return db.seatReservation.create({ data });
  }

  async deleteSeatReservation(sessionId: string, tx?: PrismaTx) {
    const db = tx || prisma;
    return db.seatReservation.deleteMany({ where: { sessionId } });
  }

  async findSeatReservation(sessionId: string, tx?: PrismaTx) {
    const db = tx || prisma;
    return db.seatReservation.findUnique({ where: { sessionId } });
  }

  async logStripeEvent(eventId: string, type: string) {
    return prisma.stripeEventLog.create({
      data: { eventId, type },
    });
  }

  async expireTrials(now = new Date()): Promise<number> {
    const result = await prisma.user.updateMany({
      where: {
        planStatus: 'trialing',
        trialEndsAt: { lt: now },
      },
      data: { planStatus: 'readonly' },
    });
    return result.count;
  }

  async getUsersWithExpiringTrials(startWindow: Date, endWindow: Date) {
    return prisma.user.findMany({
      where: {
        planStatus: 'trialing',
        trialEndsAt: { gte: startWindow, lt: endWindow },
      },
      select: { email: true, name: true, locale: true },
    });
  }

  async upsertMonthlyFinance(userId: string, monthKey: string, revenue: number, notes?: string) {
    return prisma.monthlyFinance.upsert({
      where: { userId_month: { userId, month: monthKey } },
      create: { userId, month: monthKey, revenue, notes },
      update: { revenue, notes, updatedAt: new Date() },
    });
  }

  async upsertFinanceSettings(userId: string, cashAvailable: number) {
    return prisma.financeSettings.upsert({
      where: { userId },
      create: { userId, cashAvailable },
      update: { updatedAt: new Date() },
    });
  }

  async executeTransaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn as any) as Promise<T>;
  }
}

export const subscriptionRepository = new SubscriptionRepository();
