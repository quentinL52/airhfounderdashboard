'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFounderStore } from '@/store/founder-store';
import { useGamificationStore } from '@/store/gamification-store';
import { Heart, Zap, Coins } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getMonthlyEntries } from '@/modules/finances';

interface FounderScoreWidgetProps {
  isEditMode?: boolean;
}

export function FounderScoreWidget({ isEditMode }: FounderScoreWidgetProps) {
  const { finance, hypotheses } = useFounderStore();
  const { totalXP } = useGamificationStore();

  const runwayMonths =
    getMonthlyEntries(finance.entries).length > 0
      ? Math.max(
          0,
          finance.cashAvailable /
            Math.abs(getMonthlyEntries(finance.entries)[0].expenses.reduce((sum, exp) => sum + exp.amount, 0))
        )
      : 12;

  const runwayPercentage = Math.min(100, Math.max(0, (runwayMonths / 12) * 100));

  const validatedHypotheses = hypotheses.filter((h) => h.status === 'validated').length;
  const totalHypotheses = Math.max(1, hypotheses.length);
  const validationPercentage = (validatedHypotheses / totalHypotheses) * 100;

  return (
    <Card className="h-full bg-card/80 backdrop-blur border-border overflow-hidden group hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="font-pixel text-[10px] text-muted-foreground uppercase flex items-center justify-between">
          <span>FOUNDER SCORE</span>
          <span className="text-primary text-xs font-pixel">{totalXP} PTS</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-pixel">
              <span className="flex items-center text-red-500">
                <Heart className="w-3 h-3 mr-1 fill-current" /> RUNWAY (HP)
              </span>
              <span className="text-muted-foreground">{runwayMonths.toFixed(1)} mois</span>
            </div>
            <Progress value={runwayPercentage} className="h-2 rounded-none bg-muted border border-border [&>div]:bg-red-500" />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-pixel">
              <span className="flex items-center text-blue-500">
                <Zap className="w-3 h-3 mr-1 fill-current" /> VALIDATION (MP)
              </span>
              <span className="text-muted-foreground">
                {validatedHypotheses}/{totalHypotheses}
              </span>
            </div>
            <Progress value={validationPercentage} className="h-2 rounded-none bg-muted border border-border [&>div]:bg-blue-500" />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-pixel">
              <span className="flex items-center text-yellow-500">
                <Coins className="w-3 h-3 mr-1 fill-current" /> CASH
              </span>
              <span className="text-muted-foreground">{finance.cashAvailable.toLocaleString()} €</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
