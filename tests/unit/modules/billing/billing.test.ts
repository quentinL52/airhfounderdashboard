import { describe, expect, test, vi } from 'vitest';
import {
  isSubscriptionStatusValid,
  canWrite,
  getSubscriptionEntitlement,
  calculateUsageMeter,
  hasExceededAiQuota,
  PRICING_CONFIG,
  getAvailablePeriods,
} from '@/modules/billing';

describe('Billing Domain - Subscription States & Entitlements (D7 & D1)', () => {
  test('isSubscriptionStatusValid validates strict D7 states', () => {
    expect(isSubscriptionStatusValid('trialing')).toBe(true);
    expect(isSubscriptionStatusValid('active')).toBe(true);
    expect(isSubscriptionStatusValid('readonly')).toBe(true);
    expect(isSubscriptionStatusValid('canceled')).toBe(false);
    expect(isSubscriptionStatusValid('past_due')).toBe(false);
    expect(isSubscriptionStatusValid('')).toBe(false);
  });

  test('canWrite allows write operations for trialing and active, blocks readonly', () => {
    expect(canWrite('trialing')).toBe(true);
    expect(canWrite('active')).toBe(true);
    expect(canWrite('readonly')).toBe(false);
    expect(canWrite('unknown')).toBe(false);
  });

  test('getSubscriptionEntitlement respects D1 pricing config for Core plan (BYOK)', () => {
    const entitlement = getSubscriptionEntitlement('active', 'core');
    expect(entitlement.canWrite).toBe(true);
    expect(entitlement.canRead).toBe(true);
    expect(entitlement.canExport).toBe(true);
    expect(entitlement.isByok).toBe(true);
    expect(entitlement.aiModel).toBeNull();
    expect(entitlement.aiActionsLimit).toBe(Infinity);
  });

  test('getSubscriptionEntitlement respects D1 pricing config for Complete plan', () => {
    const entitlement = getSubscriptionEntitlement('active', 'complete');
    expect(entitlement.canWrite).toBe(true);
    expect(entitlement.canRead).toBe(true);
    expect(entitlement.canExport).toBe(true);
    expect(entitlement.isByok).toBe(false);
    expect(entitlement.aiModel).toBe('mistral-small');
    expect(entitlement.aiActionsLimit).toBe(500);
  });

  test('getSubscriptionEntitlement allows read and export even when planStatus is readonly', () => {
    const entitlement = getSubscriptionEntitlement('readonly', 'complete');
    expect(entitlement.canWrite).toBe(false);
    expect(entitlement.canRead).toBe(true);
    expect(entitlement.canExport).toBe(true);
  });
});

describe('Billing Domain - Usage Meter & Quotas', () => {
  test('calculateUsageMeter calculates metrics for Complete plan', () => {
    const usage = calculateUsageMeter('user-1', 'complete', 'active', '2026-07', 250);
    expect(usage.userId).toBe('user-1');
    expect(usage.actionsUsed).toBe(250);
    expect(usage.actionsLimit).toBe(500);
    expect(usage.percentageUsed).toBe(50);
    expect(usage.isOverLimit).toBe(false);
    expect(usage.isByok).toBe(false);
  });

  test('calculateUsageMeter flags over limit when usage exceeds 500 for Complete plan', () => {
    const usage = calculateUsageMeter('user-1', 'complete', 'active', '2026-07', 500);
    expect(usage.percentageUsed).toBe(100);
    expect(usage.isOverLimit).toBe(true);
    expect(hasExceededAiQuota(usage)).toBe(true);
  });

  test('calculateUsageMeter returns unlimited BYOK metrics for Core plan', () => {
    const usage = calculateUsageMeter('user-2', 'core', 'active', '2026-07', 1500);
    expect(usage.actionsLimit).toBe(Infinity);
    expect(usage.isByok).toBe(true);
    expect(usage.isOverLimit).toBe(false);
    expect(hasExceededAiQuota(usage)).toBe(false);
  });

  test('calculateUsageMeter defaults to readonly with 0 limit when plan is null', () => {
    const usage = calculateUsageMeter('user-3', null, 'readonly', '2026-07', 0);
    expect(usage.actionsLimit).toBe(0);
    expect(usage.isOverLimit).toBe(true);
    expect(usage.planStatus).toBe('readonly');
  });
});

describe('PRICING_CONFIG Integrity Check', () => {
  test('PRICING_CONFIG has locked prices and plan structures', () => {
    expect(PRICING_CONFIG.plans.core.prices.monthly.amount).toBe(2500);
    expect(PRICING_CONFIG.plans.complete.prices.monthly.amount).toBe(3500);
    expect(PRICING_CONFIG.founderDeal.price.amount).toBe(1500);
    expect(PRICING_CONFIG.founderDeal.maxUsers).toBe(100);
  });

  test('getAvailablePeriods returns correct periods', () => {
    expect(getAvailablePeriods('core')).toContain('monthly');
    expect(getAvailablePeriods('complete')).toContain('monthly');
  });
});
