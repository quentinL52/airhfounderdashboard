import { prisma } from '@/lib/prisma';
import { PRICING_CONFIG } from '../domain/types';

type PrismaTx = any;

export async function isFounderDealAvailable(tx?: PrismaTx): Promise<boolean> {
  const client = tx || prisma;
  const counter = await client.founderDealCounter.findUnique({ where: { id: 'singleton' } });
  if (!counter) return true;
  return counter.sold < PRICING_CONFIG.founderDeal.maxUsers;
}

export async function reserveFounderSeat(tx?: PrismaTx): Promise<boolean> {
  const client = tx || prisma;
  const max = PRICING_CONFIG.founderDeal.maxUsers;

  await client.$executeRawUnsafe(`
    INSERT INTO founder_deal_counter (id, sold, total, updated_at)
    VALUES ('singleton', 0, 0, NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  const updated: number = await client.$executeRawUnsafe(
    `UPDATE founder_deal_counter SET sold = sold + 1, updated_at = NOW() WHERE id = 'singleton' AND sold < $1`,
    max,
  );
  return updated === 1;
}

export async function releaseFounderSeat(tx?: PrismaTx): Promise<void> {
  const client = tx || prisma;
  await client.$executeRawUnsafe(
    `UPDATE founder_deal_counter SET sold = GREATEST(sold - 1, 0), updated_at = NOW() WHERE id = 'singleton'`,
  );
}

export async function getFounderSeatsLeft(tx?: PrismaTx): Promise<number> {
  const client = tx || prisma;
  const counter = await client.founderDealCounter.findUnique({ where: { id: 'singleton' } });
  if (!counter) return PRICING_CONFIG.founderDeal.maxUsers;
  return Math.max(0, PRICING_CONFIG.founderDeal.maxUsers - counter.sold);
}
