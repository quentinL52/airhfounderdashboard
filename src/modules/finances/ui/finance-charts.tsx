'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFounderStore } from '@/store/founder-store';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, subMonths, eachMonthOfInterval } from 'date-fns';
import { getMonthlyEntries } from '../domain/cashflow-calculations';
import { CATEGORY_COLORS } from '../domain/expense-types';

export function FinanceCharts() {
  const finance = useFounderStore((s) => s.finance);

  const { donutData, barData } = useMemo(() => {
    const today = new Date();
    const currentMonthStr = format(today, 'yyyy-MM');

    // --- 1. Donut Chart Data (Current Month) ---
    const sortedEntries = [...getMonthlyEntries(finance.entries)].sort((a, b) => b.month.localeCompare(a.month));
    const latestEntry = sortedEntries.find((e) => e.month === currentMonthStr) || sortedEntries[0];

    const expensesByCategory: Record<string, number> = {};

    if (latestEntry) {
      (latestEntry.expenses || []).forEach((e) => {
        let monthlyAmount = 0;
        if (e.frequency === 'annual') {
          monthlyAmount = e.amount / 12;
        } else {
          monthlyAmount = e.amount;
        }

        expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + monthlyAmount;
      });
    }

    const pieData = Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    // --- 2. Bar Chart Data (Past 6 Months Stacked) ---
    const start = subMonths(today, 5);
    const pastMonths = eachMonthOfInterval({ start, end: today });

    const stackedBarData = pastMonths.map((date) => {
      const monthStr = format(date, 'yyyy-MM');
      const entry = getMonthlyEntries(finance.entries).find((e) => e.month === monthStr);

      const monthData: any = {
        month: format(date, 'MMM yy'),
        total: 0,
      };

      if (entry) {
        (entry.expenses || []).forEach((e) => {
          let amt = 0;
          if (e.frequency === 'annual') amt = e.amount / 12;
          else amt = e.amount;

          monthData[e.category] = (monthData[e.category] || 0) + amt;
          monthData.total += amt;
        });
      }
      return monthData;
    });

    return { donutData: pieData, barData: stackedBarData };
  }, [finance]);

  const formatCurrency = (value: number) => `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} €`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-3 bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-foreground">Répartition des Dépenses</CardTitle>
          <CardDescription className="text-gray-300">Dépenses du mois courant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS['Divers']} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Montant']}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Aucune donnée pour ce mois
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-4 bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-foreground">Évolution des Dépenses</CardTitle>
          <CardDescription className="text-gray-300">Historique des 6 derniers mois par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend />
                {Object.keys(CATEGORY_COLORS).map((cat) => {
                  if (cat === 'other') return null;
                  const hasData = barData.some((d) => d[cat] > 0);
                  if (!hasData) return null;

                  return <Bar key={cat} dataKey={cat} name={cat} stackId="a" fill={CATEGORY_COLORS[cat]} maxBarSize={50} />;
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
