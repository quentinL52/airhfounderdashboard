'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFounderStore } from '@/store/founder-store';
import { Wallet, Flame, ArrowRight, Calendar, TrendingUp } from 'lucide-react';
import { calculateFinancialMetrics } from '../domain/cashflow-calculations';

export function FinanceKPIs() {
  const finance = useFounderStore((s) => s.finance);

  const metrics = useMemo(() => {
    return calculateFinancialMetrics(finance.entries || [], finance.cashAvailable || 0);
  }, [finance]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Trésorerie actuelle</CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{metrics.cash.toLocaleString()} €</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Burn Rate Mensuel</CardTitle>
          <Flame className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {metrics.burn.toLocaleString(undefined, { maximumFractionDigits: 0 })} €
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Runway</CardTitle>
          <ArrowRight className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {metrics.runway === '∞' ? '∞' : `${metrics.runway} mois`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Dépenses Annuelles</CardTitle>
          <Calendar className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {metrics.annualExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })} €
          </div>
          <p className="text-xs text-muted-foreground mt-1">Projeté sur 12 mois</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Revenus Mensuels</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {metrics.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} €
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
