import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isSubscriptionStatusValid,
  canWrite,
  getSubscriptionEntitlement,
  PRICING_CONFIG,
} from '@/modules/billing/domain';
import { SubscriptionLifecycle } from '@/modules/billing/application/subscription-lifecycle';

describe('Billing Module — Domain Entitlements (Decision D1 & D7)', () => {
  it('strictly validates subscription statuses (Decision D7)', () => {
    expect(isSubscriptionStatusValid('trialing')).toBe(true);
    expect(isSubscriptionStatusValid('active')).toBe(true);
    expect(isSubscriptionStatusValid('readonly')).toBe(true);
    expect(isSubscriptionStatusValid('canceled')).toBe(false);
    expect(isSubscriptionStatusValid('past_due')).toBe(false);
    expect(isSubscriptionStatusValid('unknown')).toBe(false);
  });

  it('correctly determines write access based on subscription status', () => {
    expect(canWrite('active')).toBe(true);
    expect(canWrite('trialing')).toBe(true);
    expect(canWrite('readonly')).toBe(false);
    expect(canWrite('invalid_status')).toBe(false);
  });

  it('provides correct entitlements for Core (BYOK) plan under active state', () => {
    const entitlement = getSubscriptionEntitlement('active', 'core');
    expect(entitlement.canWrite).toBe(true);
    expect(entitlement.canRead).toBe(true);
    expect(entitlement.canExport).toBe(true);
    expect(entitlement.isByok).toBe(true);
    expect(entitlement.aiActionsLimit).toBe(Infinity);
  });

  it('provides correct entitlements for Complete plan under active state', () => {
    const entitlement = getSubscriptionEntitlement('active', 'complete');
    expect(entitlement.canWrite).toBe(true);
    expect(entitlement.canRead).toBe(true);
    expect(entitlement.canExport).toBe(true);
    expect(entitlement.isByok).toBe(false);
    expect(entitlement.aiActionsLimit).toBe(500);
    expect(entitlement.aiModel).toBe('mistral-small');
  });

  it('restricts write but preserves read & export in readonly state (Decision D7)', () => {
    const coreEntitlement = getSubscriptionEntitlement('readonly', 'core');
    expect(coreEntitlement.canWrite).toBe(false);
    expect(coreEntitlement.canRead).toBe(true);
    expect(coreEntitlement.canExport).toBe(true);

    const completeEntitlement = getSubscriptionEntitlement('readonly', 'complete');
    expect(completeEntitlement.canWrite).toBe(false);
    expect(completeEntitlement.canRead).toBe(true);
    expect(completeEntitlement.canExport).toBe(true);
  });

  it('ensures PRICING_CONFIG adheres to Decision D1 (no feature-gating per plan)', () => {
    expect(PRICING_CONFIG.plans.core.limits.aiActions).toBe(Infinity);
    expect(PRICING_CONFIG.plans.complete.limits.aiActions).toBe(500);
    expect(PRICING_CONFIG.founderDeal.maxUsers).toBe(100);
  });
});

describe('SubscriptionLifecycle Application Service', () => {
  let lifecycle: SubscriptionLifecycle;

  beforeEach(() => {
    lifecycle = new SubscriptionLifecycle();
  });

  it('returns a 403 response when user has readonly status in assertCanWrite', async () => {
    const mockRepository = {
      findUserById: vi.fn().mockResolvedValue({ id: 'user_1', planStatus: 'readonly' }),
    };

    (lifecycle as any).repository = mockRepository;

    const response = await lifecycle.assertCanWrite('user_1');
    expect(response).not.toBeNull();
    expect(response?.status).toBe(403);

    const body = await response?.json();
    expect(body?.error).toBe('subscription_required');
  });

  it('returns null when user is trialing or active in assertCanWrite', async () => {
    const mockRepositoryActive = {
      findUserById: vi.fn().mockResolvedValue({ id: 'user_1', planStatus: 'active' }),
    };
    (lifecycle as any).repository = mockRepositoryActive;
    let response = await lifecycle.assertCanWrite('user_1');
    expect(response).toBeNull();

    const mockRepositoryTrialing = {
      findUserById: vi.fn().mockResolvedValue({ id: 'user_1', planStatus: 'trialing' }),
    };
    (lifecycle as any).repository = mockRepositoryTrialing;
    response = await lifecycle.assertCanWrite('user_1');
    expect(response).toBeNull();
  });
});
