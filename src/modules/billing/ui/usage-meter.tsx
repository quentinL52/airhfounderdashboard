'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, AlertTriangle, Key } from 'lucide-react';
import type { UsageMeterData } from '../domain/types';

interface UsageMeterProps {
  usage: UsageMeterData;
  className?: string;
}

export function UsageMeter({ usage, className = '' }: UsageMeterProps) {
  const t = useTranslations('billing');

  if (usage.isByok) {
    return (
      <Card className={`border border-blue-500/20 bg-blue-500/5 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              {t('usageTitle')}
            </CardTitle>
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
              {t('unlimitedByok')}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {t('usageSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            BYOK (Core) plan uses your own API keys without platform AI action caps.
          </p>
        </CardContent>
      </Card>
    );
  }

  const actionsLimit = usage.actionsLimit;
  const isNearLimit = usage.percentageUsed >= 80 && !usage.isOverLimit;
  const isOverLimit = usage.isOverLimit;

  let progressColor = 'bg-primary';
  if (isOverLimit) {
    progressColor = 'bg-destructive';
  } else if (isNearLimit) {
    progressColor = 'bg-amber-500';
  }

  return (
    <Card className={`border border-border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            {t('usageTitle')}
          </CardTitle>
          <span className="text-xs font-mono font-semibold">
            {t('actionsUsed', { used: usage.actionsUsed, limit: actionsLimit })}
          </span>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          {t('usageSubtitle')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <Progress
          value={usage.percentageUsed}
          className="h-2.5 bg-secondary"
          indicatorClassName={progressColor}
        />

        {isOverLimit && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{t('quotaExceeded')}</span>
          </div>
        )}

        {isNearLimit && (
          <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 p-2.5 rounded-md border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Approaching monthly action limit ({usage.percentageUsed}% used).</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
