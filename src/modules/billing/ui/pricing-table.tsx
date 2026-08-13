'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Crown, Sparkles, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PRICING_CONFIG, type PlanType, type Period, type PricingStatusResponse } from '../domain/types';

interface PricingTableProps {
  planStatus: string;
  currentPlan?: PlanType | null;
  onCheckoutSuccess?: (url: string) => void;
}

export function PricingTable({
  planStatus,
  currentPlan,
  onCheckoutSuccess,
}: PricingTableProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pricingStatus, setPricingStatus] = useState<PricingStatusResponse | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('monthly');
  const { toast } = useToast();
  const t = useTranslations('billing');
  const te = useTranslations('errors');

  useEffect(() => {
    fetch('/api/billing/pricing-status')
      .then((r) => r.json())
      .then(setPricingStatus)
      .catch(() => {});
  }, []);

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
      if (data.url) {
        if (onCheckoutSuccess) {
          onCheckoutSuccess(data.url);
        } else {
          window.location.href = data.url;
        }
      }
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

  const periodSuffixKey = selectedPeriod === 'monthly' ? 'perMonth' : 'perYear';

  return (
    <div className="space-y-6">
      {planStatus === 'readonly' && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {t('readonlyNotice')}
        </div>
      )}

      {planStatus === 'trialing' && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200">
          {t('trialNotice')}
        </div>
      )}

      <div className="flex gap-2 mb-6 justify-center">
        {['monthly', 'yearly'].map((p) => (
          <Button
            key={p}
            variant={selectedPeriod === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(p as Period)}
          >
            {t(p)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core (BYOK) Plan */}
        <Card className="border border-border rounded-xl p-5 flex flex-col justify-between bg-card/60 backdrop-blur">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                {PRICING_CONFIG.plans.core.name}
              </h3>
              {currentPlan === 'core' && (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Plan actuel
                </Badge>
              )}
            </div>
            <div className="text-3xl font-bold mb-4 text-foreground">
              {(PRICING_CONFIG.plans.core.prices[selectedPeriod].amount / 100).toFixed(0)}€
              <span className="text-sm font-normal text-muted-foreground ml-1">{t(periodSuffixKey)}</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 mb-6">
              {PRICING_CONFIG.plans.core.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button
            onClick={() => handleCheckout('core')}
            disabled={isLoading || currentPlan === 'core'}
            variant="outline"
            className="w-full mt-4"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentPlan === 'core' ? 'Plan Actuel' : t('subscribeNow')}
          </Button>
        </Card>

        {/* Complete Plan */}
        <Card className="border border-primary rounded-xl p-5 flex flex-col justify-between bg-primary/5 backdrop-blur relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
            Recommandé
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {PRICING_CONFIG.plans.complete.name}
              </h3>
              {currentPlan === 'complete' && (
                <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Plan actuel
                </Badge>
              )}
            </div>
            <div className="text-3xl font-bold text-primary mb-4">
              {(PRICING_CONFIG.plans.complete.prices[selectedPeriod].amount / 100).toFixed(0)}€
              <span className="text-sm font-normal text-primary/70 ml-1">{t(periodSuffixKey)}</span>
            </div>
            <ul className="text-sm text-foreground space-y-2 mb-6">
              {PRICING_CONFIG.plans.complete.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button
            onClick={() => handleCheckout('complete')}
            disabled={isLoading || currentPlan === 'complete'}
            className="w-full mt-4"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentPlan === 'complete' ? 'Plan Actuel' : t('subscribeNow')}
          </Button>
        </Card>
      </div>

      {/* Founder Deal */}
      {pricingStatus?.founderDeal.isAvailable && (
        <div className="mt-8 border border-amber-500/50 rounded-xl p-6 bg-amber-500/10 backdrop-blur relative">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg text-amber-400 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Founder Deal (Lifetime Lock)
            </h3>
            <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              {pricingStatus.founderDeal.seatsLeft} places restantes
            </Badge>
          </div>
          <p className="text-sm text-amber-200/90 mb-5">
            Accédez à toutes les fonctionnalités du plan <strong>Complete</strong> pour un tarif garanti à vie de {(PRICING_CONFIG.founderDeal.price.amount / 100).toFixed(0)}€ / mois.
          </p>
          <Button
            onClick={() => handleCheckout('founder')}
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Réclamer le Founder Deal
          </Button>
        </div>
      )}
    </div>
  );
}
