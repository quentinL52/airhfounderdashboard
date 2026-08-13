'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFounderStore } from '@/store/founder-store';
import { ArrowDown, ArrowUp, Wallet, TrendingUp, DollarSign } from 'lucide-react';
import { getMonthlyEntries, calculateMonthlyBurn, calculateRunwayMonths } from '../domain/cashflow-calculations';

export function RunwayWidget() {
  const finance = useFounderStore((s) => s.finance);

  const metrics = useMemo(() => {
    const sortedEntries = [...getMonthlyEntries(finance.entries)].sort((a, b) => b.month.localeCompare(a.month));

    let monthlyBurn = 0;

    if (sortedEntries.length > 0) {
      const lastMonth = sortedEntries[0];
      monthlyBurn = calculateMonthlyBurn(lastMonth.expenses || [], lastMonth.incomes || []);
    }

    const runway = calculateRunwayMonths(finance.cashAvailable, monthlyBurn);

    return {
      runway,
      burn: monthlyBurn,
      cash: finance.cashAvailable,
    };
  }, [finance]);

  const runwayNum = parseFloat(metrics.runway);
  const isCritical = !isNaN(runwayNum) && runwayNum < 3;
  const isWarning = !isNaN(runwayNum) && runwayNum < 6 && runwayNum >= 3;

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Runway</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${isCritical ? 'text-danger' : isWarning ? 'text-warning' : 'text-success'}`}>
          {metrics.runway === '∞' ? '∞' : `${metrics.runway} months`}
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          {metrics.burn > 0 ? (
            <span className="flex items-center text-danger">
              <ArrowDown className="h-3 w-3 mr-1" />
              {metrics.burn.toLocaleString()}€ / month burn
            </span>
          ) : (
            <span className="flex items-center text-success">
              <ArrowUp className="h-3 w-3 mr-1" />
              Profitable
            </span>
          )}
        </p>
        <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full ${isCritical ? 'bg-danger' : 'bg-success'}`}
            style={{ width: `${Math.min(((runwayNum || 12) / 12) * 100, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function MRRWidget() {
  const finance = useFounderStore((s) => s.finance);

  const metrics = useMemo(() => {
    const monthlyList = getMonthlyEntries(finance.entries);
    const latestEntry = monthlyList[0];
    const incomes = latestEntry?.incomes || [];
    const mrr = incomes.reduce((sum, i) => {
      if (i.frequency === 'annual') return sum + (i.amount || 0) / 12;
      if (i.frequency === 'monthly' || !i.frequency) return sum + (i.amount || 0);
      return sum;
    }, 0);

    return {
      mrr,
      arr: mrr * 12,
      targetMrr: finance.targetMRR || 0,
    };
  }, [finance]);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Monthly Recurring Revenue (MRR)</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-success">{metrics.mrr.toLocaleString()} €</div>
        <p className="text-xs text-muted-foreground pt-1">ARR: {metrics.arr.toLocaleString()} €</p>
      </CardContent>
    </Card>
  );
}
