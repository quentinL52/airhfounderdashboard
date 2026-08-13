'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Sparkles, Crown, ShieldAlert } from 'lucide-react';
import type { PlanType, SubscriptionStatus } from '../domain/types';
import { PRICING_CONFIG } from '../domain/types';

interface SubscriptionStatusBadgeProps {
  planStatus: SubscriptionStatus | string;
  plan: PlanType | null;
  founderDeal?: boolean;
  className?: string;
}

const PLAN_BADGES: Record<PlanType, { icon: typeof CreditCard; className: string }> = {
  core: { icon: CreditCard, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  complete: { icon: Sparkles, className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

const STATUS_BADGES: Record<SubscriptionStatus, { className: string }> = {
  active: { className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  trialing: { className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  readonly: { className: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
};

export function SubscriptionStatusBadge({
  planStatus,
  plan,
  founderDeal = false,
  className = '',
}: SubscriptionStatusBadgeProps) {
  const t = useTranslations('billing');

  const normalizedStatus: SubscriptionStatus =
    planStatus === 'active' ? 'active' : planStatus === 'trialing' ? 'trialing' : 'readonly';

  const statusConfig = STATUS_BADGES[normalizedStatus];
  const planConfig = plan ? PLAN_BADGES[plan] : null;
  const planName = plan ? PRICING_CONFIG.plans[plan]?.name : null;

  const statusLabel =
    normalizedStatus === 'active'
      ? t('statusActive')
      : normalizedStatus === 'trialing'
      ? t('statusTrialing')
      : t('statusReadonly');

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {plan && planConfig && planName && (
        <Badge variant="outline" className={`text-sm px-3 py-1 font-medium ${planConfig.className}`}>
          {React.createElement(planConfig.icon, { className: 'w-4 h-4 mr-1.5 inline-block' })}
          {planName}
        </Badge>
      )}

      <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-medium ${statusConfig.className}`}>
        {normalizedStatus === 'readonly' && <ShieldAlert className="w-3.5 h-3.5 mr-1 inline-block" />}
        {statusLabel}
      </Badge>

      {founderDeal && (
        <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-xs px-2.5 py-0.5">
          <Crown className="w-3.5 h-3.5 mr-1 inline-block" />
          Founder Deal
        </Badge>
      )}
    </div>
  );
}
