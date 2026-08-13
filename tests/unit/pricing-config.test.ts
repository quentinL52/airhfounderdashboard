import { describe, expect, test } from 'vitest';
import { PRICING_CONFIG, getAvailablePeriods } from '@/lib/billing/pricing-config';

describe('PRICING_CONFIG', () => {
  test('founderDeal is properly configured', () => {
    expect(PRICING_CONFIG.founderDeal.maxUsers).toBe(100);
    expect(PRICING_CONFIG.founderDeal.price.amount).toBe(1500);
    expect(PRICING_CONFIG.founderDeal.planProvided).toBe('complete');
  });

  test('core plan has BYOK features', () => {
    expect(PRICING_CONFIG.plans.core.features).toContain('Bring your own key');
    expect(PRICING_CONFIG.plans.core.aiModel).toBeNull();
    expect(PRICING_CONFIG.plans.core.limits.aiActions).toBe(Infinity);
  });

  test('complete plan has mistral-small and action limits', () => {
    expect(PRICING_CONFIG.plans.complete.aiModel).toBe('mistral-small');
    expect(PRICING_CONFIG.plans.complete.limits.aiActions).toBe(500);
  });

  test('prices match spec exactly (in cents EUR)', () => {
    expect(PRICING_CONFIG.plans.core.prices.monthly.amount).toBe(2500);
    expect(PRICING_CONFIG.plans.complete.prices.monthly.amount).toBe(3500);
  });
});

describe('getAvailablePeriods validates valid combos', () => {
  test('core has monthly', () => {
    expect(getAvailablePeriods('core')).toContain('monthly');
  });

  test('complete has monthly', () => {
    expect(getAvailablePeriods('complete')).toContain('monthly');
  });
});
