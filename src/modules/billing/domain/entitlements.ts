import { PRICING_CONFIG, type PlanStatus, type PlanType } from '@/lib/billing/pricing-config';
import type { SubscriptionEntitlement, SubscriptionStatus, UsageMeterData } from './types';

/**
 * Validates that a string matches one of the locked subscription states:
 * 'trialing' | 'active' | 'readonly' (Decision D7)
 */
export function isSubscriptionStatusValid(status: string): status is SubscriptionStatus {
  return status === 'trialing' || status === 'active' || status === 'readonly';
}

/**
 * Returns whether a user with the given planStatus can perform write operations.
 * Fin of trial/sub = 'readonly' (read + export allowed, zero deletion, no write) (Decision D7)
 */
export function canWrite(planStatus: PlanStatus | string): boolean {
  if (!isSubscriptionStatusValid(planStatus)) {
    return false;
  }
  return planStatus !== 'readonly';
}

/**
 * Calculates domain entitlements based on plan status and plan type.
 * Decision D1: No feature-gating by plan, Core = BYOK, Complete = AI included.
 */
export function getSubscriptionEntitlement(
  planStatus: PlanStatus | string,
  plan: PlanType | null
): SubscriptionEntitlement {
  const writeAllowed = canWrite(planStatus);

  if (!plan) {
    return {
      canWrite: writeAllowed,
      canRead: true,
      canExport: true,
      aiActionsLimit: 0,
      isByok: false,
      aiModel: null,
    };
  }

  const planConfig = PRICING_CONFIG.plans[plan];
  if (!planConfig) {
    return {
      canWrite: writeAllowed,
      canRead: true,
      canExport: true,
      aiActionsLimit: 0,
      isByok: false,
      aiModel: null,
    };
  }

  return {
    canWrite: writeAllowed,
    canRead: true, // Always allowed
    canExport: true, // Always allowed (Decision D7: read + export always possible)
    aiActionsLimit: planConfig.limits.aiActions,
    isByok: plan === 'core',
    aiModel: planConfig.aiModel,
  };
}

/**
 * Calculates usage meter metrics for AI actions tracking (Complete plan AI actions).
 */
export function calculateUsageMeter(
  userId: string,
  plan: PlanType | null,
  planStatus: SubscriptionStatus | string,
  month: string,
  actionsUsed: number
): UsageMeterData {
  const validStatus: SubscriptionStatus = isSubscriptionStatusValid(planStatus)
    ? planStatus
    : 'readonly';
  const entitlement = getSubscriptionEntitlement(validStatus, plan);

  const actionsLimit = entitlement.aiActionsLimit;
  const isByok = entitlement.isByok;

  if (isByok || actionsLimit === Infinity) {
    return {
      userId,
      month,
      actionsUsed,
      actionsLimit: Infinity,
      percentageUsed: 0,
      isOverLimit: false,
      isByok: true,
      plan,
      planStatus: validStatus,
    };
  }

  if (actionsLimit <= 0) {
    return {
      userId,
      month,
      actionsUsed,
      actionsLimit: 0,
      percentageUsed: 100,
      isOverLimit: true,
      isByok: false,
      plan,
      planStatus: validStatus,
    };
  }

  const percentageUsed = Math.min(100, Math.round((actionsUsed / actionsLimit) * 100));
  const isOverLimit = actionsUsed >= actionsLimit;

  return {
    userId,
    month,
    actionsUsed,
    actionsLimit,
    percentageUsed,
    isOverLimit,
    isByok: false,
    plan,
    planStatus: validStatus,
  };
}

/**
 * Determines if a user has exceeded their AI quota for Complete plan.
 */
export function hasExceededAiQuota(usage: UsageMeterData): boolean {
  if (usage.isByok) return false;
  return usage.isOverLimit;
}
