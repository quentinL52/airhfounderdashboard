'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useFounderStore } from '@/store/founder-store';
import { translations } from '@/lib/translations';
import { ChartSkeleton, TableSkeleton, CardSkeleton } from '@/components/ui/loading-skeleton';
import { Wallet } from 'lucide-react';
import {
  FinanceKPIs,
  FinanceCharts,
  RecurringExpensesList,
  getMonthlyEntries,
} from '@/modules/finances';
import type { Timeframe } from '@/modules/finances';
import { PageAgent } from '@/components/agent/PageAgent';
import { createClient } from '@/utils/supabase/client';

const RunwayChart = dynamic(
  () => import('@/modules/finances').then((m) => m.RunwayChart),
  { loading: () => <ChartSkeleton /> }
);
const FinanceEntryForm = dynamic(
  () => import('@/modules/finances').then((m) => m.FinanceEntryForm),
  { loading: () => <CardSkeleton /> }
);
const FinanceTable = dynamic(
  () => import('@/modules/finances').then((m) => m.FinanceTable),
  { loading: () => <TableSkeleton /> }
);

export default function FinancesPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('month');
  const [userId, setUserId] = useState<string | null>(null);
  const language = useFounderStore((s) => s.language);
  const t = translations[language].finance;
  const finances = useFounderStore((s) => s.finance);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  const monthlyEntries = getMonthlyEntries(finances?.entries || []);
  const pageContext = monthlyEntries?.length
    ? `Finances actuelles : ${monthlyEntries.length} mois de données.`
    : 'Aucune donnée financière pour le moment.';

  return (
    <div className="flex flex-col h-full space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-pixel text-amber-500 flex items-center gap-3">
            <Wallet className="w-8 h-8" />
            {t.title}
          </h2>
          <p className="text-muted-foreground mt-2">{t.subtitle}</p>
        </div>
      </div>

      <FinanceKPIs />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <RunwayChart timeframe={timeframe} setTimeframe={setTimeframe} />
      </div>

      <FinanceCharts />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-7 lg:col-span-3">
          <FinanceEntryForm />
        </div>
        <div className="col-span-7 lg:col-span-4 space-y-4">
          <RecurringExpensesList />
          <FinanceTable timeframe={timeframe} />
        </div>
      </div>

      {userId && <PageAgent userId={userId} pageLabel="Finances" pageContext={pageContext} />}
    </div>
  );
}
