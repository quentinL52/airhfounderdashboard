export {
  PRICING_CONFIG,
  getAvailablePeriods,
  type PlanType,
  type Period,
  type PlanStatus,
  type StripePriceKey,
  type PlanLimitConfig,
} from '@/lib/billing/pricing-config';

export type SubscriptionStatus = 'trialing' | 'active' | 'readonly';

export interface UserSubscriptionInfo {
  userId: string;
  planStatus: SubscriptionStatus;
  plan: 'core' | 'complete' | null;
  founderDeal: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  trialEndsAt?: Date | null;
}

export interface SubscriptionEntitlement {
  canWrite: boolean;
  canRead: boolean;
  canExport: boolean;
  aiActionsLimit: number;
  isByok: boolean;
  aiModel: string | null;
}

export interface PricingStatusResponse {
  founderDeal: {
    isAvailable: boolean;
    seatsLeft: number;
    taken: number;
    max: number;
  };
  plans: typeof import('@/lib/billing/pricing-config').PRICING_CONFIG.plans;
}

export interface UsageMeterData {
  userId: string;
  month: string;
  actionsUsed: number;
  actionsLimit: number;
  percentageUsed: number;
  isOverLimit: boolean;
  isByok: boolean;
  plan: 'core' | 'complete' | null;
  planStatus: SubscriptionStatus;
}

export interface AiUsageRecord {
  id?: string;
  userId: string;
  month: string;
  actions: number;
  tokens: number;
  scope: string;
  model: string;
}
