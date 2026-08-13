'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFounderStore } from '@/store/founder-store';
import type { PlanType, Period, PricingStatusResponse, UsageMeterData } from '../domain/types';
import { SubscriptionStatusBadge } from './subscription-status-badge';
import { UsageMeter } from './usage-meter';
import { PricingCards } from './pricing-cards';

interface BillingPanelProps {
  initialUsage?: UsageMeterData | null;
  className?: string;
}

export function BillingPanel({ initialUsage = null, className = '' }: BillingPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pricingStatus, setPricingStatus] = useState<PricingStatusResponse | null>(null);
  const [usageMeter, setUsageMeter] = useState<UsageMeterData | null>(initialUsage);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('monthly');
  const { toast } = useToast();
  const t = useTranslations('billing');
  const te = useTranslations('errors');

  const planStatus = useFounderStore((s) => s.planStatus);
  const plan = useFounderStore((s) => s.plan);
  const founderDeal = useFounderStore((s) => s.founderDeal);

  useEffect(() => {
    fetch('/api/billing/pricing-status')
      .then((r) => r.json())
      .then((data) => setPricingStatus(data))
      .catch(() => {});
  }, []);

  const isSubscribed = planStatus === 'active' && plan;

  const handleCheckout = async (planKey: PlanType | 'founder') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: selectedPeriod, plan: planKey }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || te('checkoutFailed'));
      if (data.url) window.location.href = data.url;
    } catch (error: any) {
      toast({
        title: te('checkoutFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortal = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || te('generic'));
    } catch (error: any) {
      toast({
        title: te('generic'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`border-t-4 border-t-primary ${className}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t('title')}
            </CardTitle>
            <CardDescription className="mt-1">
              {isSubscribed ? t('subscribedDescription') : t('unsubscribedDescription')}
            </CardDescription>
          </div>

          <SubscriptionStatusBadge
            planStatus={planStatus}
            plan={plan}
            founderDeal={founderDeal}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {usageMeter && <UsageMeter usage={usageMeter} />}

        {isSubscribed && plan ? (
          <div className="space-y-4 pt-2">
            <Button onClick={handlePortal} disabled={isLoading} variant="outline">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('manageSubscription')}
            </Button>
          </div>
        ) : (
          <PricingCards
            planStatus={planStatus}
            pricingStatus={pricingStatus}
            selectedPeriod={selectedPeriod}
            onSelectPeriod={setSelectedPeriod}
            onCheckout={handleCheckout}
            isLoading={isLoading}
          />
        )}
      </CardContent>
    </Card>
  );
}
