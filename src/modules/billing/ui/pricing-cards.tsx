'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2 } from 'lucide-react';
import { PRICING_CONFIG, type PlanType, type Period, type PricingStatusResponse } from '../domain/types';

interface PricingCardsProps {
  planStatus: string;
  pricingStatus: PricingStatusResponse | null;
  selectedPeriod: Period;
  onSelectPeriod: (p: Period) => void;
  onCheckout: (plan: PlanType | 'founder') => void;
  isLoading: boolean;
  className?: string;
}

export function PricingCards({
  planStatus,
  pricingStatus,
  selectedPeriod,
  onSelectPeriod,
  onCheckout,
  isLoading,
  className = '',
}: PricingCardsProps) {
  const t = useTranslations('billing');
  const periodSuffixKey = selectedPeriod === 'monthly' ? 'perMonth' : 'perYear';

  return (
    <div className={`space-y-6 ${className}`}>
      {planStatus === 'readonly' && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          {t('readonlyNotice')}
        </div>
      )}

      {planStatus === 'trialing' && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm">
          {t('trialNotice')}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {(['monthly'] as Period[]).map((p) => (
          <Button
            key={p}
            variant={selectedPeriod === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectPeriod(p)}
          >
            {t(p)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Plan */}
        <div className="border border-border rounded-xl p-5 flex flex-col bg-card">
          <h3 className="font-bold text-lg mb-2">{PRICING_CONFIG.plans.core.name}</h3>
          <div className="text-3xl font-bold mb-4">
            {(PRICING_CONFIG.plans.core.prices[selectedPeriod].amount / 100).toFixed(0)}€
            <span className="text-sm font-normal text-muted-foreground ml-1">{t(periodSuffixKey)}</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2 mb-6 flex-1">
            {PRICING_CONFIG.plans.core.features.map((f, i) => (
              <li key={i}>• {f}</li>
            ))}
          </ul>
          <Button
            onClick={() => onCheckout('core')}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('subscribeNow')}
          </Button>
        </div>

        {/* Complete Plan */}
        <div className="border border-primary rounded-xl p-5 flex flex-col bg-primary/5">
          <h3 className="font-bold text-lg text-primary mb-2">
            {PRICING_CONFIG.plans.complete.name}
          </h3>
          <div className="text-3xl font-bold text-primary mb-4">
            {(PRICING_CONFIG.plans.complete.prices[selectedPeriod].amount / 100).toFixed(0)}€
            <span className="text-sm font-normal text-primary/70 ml-1">{t(periodSuffixKey)}</span>
          </div>
          <ul className="text-sm text-foreground space-y-2 mb-6 flex-1">
            {PRICING_CONFIG.plans.complete.features.map((f, i) => (
              <li key={i}>• {f}</li>
            ))}
          </ul>
          <Button onClick={() => onCheckout('complete')} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('subscribeNow')}
          </Button>
        </div>
      </div>

      {pricingStatus?.founderDeal?.isAvailable && (
        <div className="mt-8 border border-amber-500 rounded-xl p-5 bg-amber-500/10">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-amber-500 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Founder Deal (Lifetime)
            </h3>
            <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/30">
              {pricingStatus.founderDeal.seatsLeft} seats left
            </Badge>
          </div>
          <p className="text-sm mb-4">
            Get all <strong>Complete</strong> plan features for a locked-in price of{' '}
            {(PRICING_CONFIG.founderDeal.price.amount / 100).toFixed(0)}€ / month for life.
          </p>
          <Button
            onClick={() => onCheckout('founder')}
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Claim Founder Deal
          </Button>
        </div>
      )}
    </div>
  );
}

export { PricingCards as PricingTable };

