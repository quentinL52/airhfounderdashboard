'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFounderStore } from '@/store/founder-store';
import {
  format,
  isSameWeek,
  isSameMonth,
  isSameQuarter,
  isSameYear,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachYearOfInterval,
  addMonths,
  subMonths,
} from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings } from 'lucide-react';
import { translations } from '@/lib/translations';
import { getMonthlyEntries, calculateMonthlyBurn, calculateRunwayMonths } from '../domain/cashflow-calculations';

export type Timeframe = 'week' | 'month' | 'quarter' | 'year';

interface RunwayChartProps {
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
}

export function RunwayChart({ timeframe, setTimeframe }: RunwayChartProps) {
  const finance = useFounderStore((s) => s.finance);
  const updateFinanceData = useFounderStore((s) => s.updateFinanceData);
  const language = useFounderStore((s) => s.language);
  const t = translations[language]?.finance;
  const formT = translations[language]?.finance?.form;

  const data = useMemo(() => {
    const baseTransactions = getMonthlyEntries(finance.entries).flatMap((month) => {
      const expenses = (month.expenses || []).map((e) => ({
        date: new Date(e.date || `${month.month}-01`),
        amount: e.amount,
        type: 'expense',
      }));
      const incomes = (month.incomes || []).map((i) => ({
        date: new Date(i.date || `${month.month}-01`),
        amount: i.amount,
        type: 'income',
      }));
      return [...expenses, ...incomes];
    });

    const today = new Date();
    const start = subMonths(today, 6);
    const end = addMonths(today, 12);
    const currentMonthStr = format(today, 'yyyy-MM');

    const projectedTransactions = [...baseTransactions];
    const sortedEntries = [...getMonthlyEntries(finance.entries)].sort((a, b) => b.month.localeCompare(a.month));
    const latestEntry = sortedEntries.find((e) => e.month === currentMonthStr) || sortedEntries[0];

    if (latestEntry) {
      const futureMonths = eachMonthOfInterval({ start: addMonths(today, 1), end });
      const latestExpenses = latestEntry.expenses || [];
      const latestIncomes = latestEntry.incomes || [];

      futureMonths.forEach((fm) => {
        latestExpenses.forEach((e) => {
          const isMonthly = e.frequency === 'monthly';
          const isAnnual = e.frequency === 'annual';
          if (isMonthly || isAnnual) {
            const projectedDate = new Date(e.date || `${latestEntry.month}-01`);
            projectedDate.setFullYear(fm.getFullYear(), fm.getMonth());
            projectedTransactions.push({
              date: projectedDate,
              amount: isAnnual ? e.amount / 12 : e.amount,
              type: 'expense',
            });
          }
        });
        latestIncomes.forEach((i) => {
          const isMonthly = i.frequency === 'monthly';
          const isAnnual = i.frequency === 'annual';
          if (isMonthly || isAnnual) {
            const projectedDate = new Date(i.date || `${latestEntry.month}-01`);
            projectedDate.setFullYear(fm.getFullYear(), fm.getMonth());
            projectedTransactions.push({
              date: projectedDate,
              amount: isAnnual ? i.amount / 12 : i.amount,
              type: 'income',
            });
          }
        });
      });
    }

    const transactions = projectedTransactions;

    let intervals: Date[];
    switch (timeframe) {
      case 'week':
        intervals = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        break;
      case 'month':
        intervals = eachMonthOfInterval({ start, end });
        break;
      case 'quarter':
        intervals = eachQuarterOfInterval({ start, end });
        break;
      case 'year':
        intervals = eachYearOfInterval({ start, end });
        break;
    }

    const aggregated = intervals.map((intervalStart) => {
      let label = '';
      let isSameFn: (dateLeft: Date, dateRight: Date) => boolean;

      switch (timeframe) {
        case 'week':
          label = format(intervalStart, 'd MMM');
          isSameFn = (d1, d2) => isSameWeek(d1, d2, { weekStartsOn: 1 });
          break;
        case 'month':
          label = format(intervalStart, 'MMM yy');
          isSameFn = isSameMonth;
          break;
        case 'quarter':
          label = `Q${Math.floor((intervalStart.getMonth() + 3) / 3)} ${format(intervalStart, 'yy')}`;
          isSameFn = isSameQuarter;
          break;
        case 'year':
          label = format(intervalStart, 'yyyy');
          isSameFn = isSameYear;
          break;
      }

      const intervalTransactions = transactions.filter((t) => isSameFn(t.date, intervalStart));
      const expenseSum = intervalTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const incomeSum = intervalTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        date: intervalStart.getTime(),
        label,
        expense: expenseSum,
        income: incomeSum,
        netFlow: incomeSum - expenseSum,
      };
    });

    const now = new Date();
    let cumulativeFlow = 0;
    const withCumulative = aggregated.map((item) => {
      cumulativeFlow += item.netFlow;
      return { ...item, cumulativeRelative: cumulativeFlow };
    });

    const todayIntervalIndex = aggregated.findIndex((item) => {
      const itemDate = new Date(item.date);
      return timeframe === 'week'
        ? isSameWeek(itemDate, now, { weekStartsOn: 1 })
        : timeframe === 'month'
        ? isSameMonth(itemDate, now)
        : timeframe === 'quarter'
        ? isSameQuarter(itemDate, now)
        : isSameYear(itemDate, now);
    });

    let offset = 0;
    if (todayIntervalIndex >= 0) {
      const todayItem = withCumulative[todayIntervalIndex];
      offset = finance.cashAvailable - todayItem.cumulativeRelative;
    } else {
      offset = finance.cashAvailable;
    }

    return withCumulative.map((item) => ({
      ...item,
      balance: item.cumulativeRelative + offset,
    }));
  }, [finance, timeframe]);

  const runwayMonths = useMemo(() => {
    const today = new Date();
    const currentMonthStr = format(today, 'yyyy-MM');

    const sortedEntries = [...getMonthlyEntries(finance.entries)].sort((a, b) => b.month.localeCompare(a.month));
    const latestEntry = sortedEntries.find((e) => e.month === currentMonthStr) || sortedEntries[0];

    if (!latestEntry) return '∞';

    const burn = calculateMonthlyBurn(latestEntry.expenses || [], latestEntry.incomes || []);
    return calculateRunwayMonths(finance.cashAvailable, burn);
  }, [finance]);

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    switch (timeframe) {
      case 'week':
        return format(date, 'd MMM');
      case 'month':
        return format(date, 'MMM yy');
      case 'quarter':
        return `Q${Math.floor((date.getMonth() + 3) / 3)} ${format(date, 'yy')}`;
      case 'year':
        return format(date, 'yyyy');
    }
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-foreground">
          <span>{t.chart.title}</span>
          <div className="flex items-center gap-4">
            <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={t.chart.timeframe.month} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">{t.chart.timeframe.week}</SelectItem>
                <SelectItem value="month">{t.chart.timeframe.month}</SelectItem>
                <SelectItem value="quarter">{t.chart.timeframe.quarter}</SelectItem>
                <SelectItem value="year">{t.chart.timeframe.year}</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Settings</h4>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="targetMRR">Target MRR</Label>
                      <Input
                        id="targetMRR"
                        type="number"
                        defaultValue={finance.targetMRR || ''}
                        className="col-span-2"
                        onBlur={(e) => updateFinanceData({ targetMRR: parseFloat(e.target.value) || undefined })}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="firstRevDate">First Rev Date</Label>
                      <Input
                        id="firstRevDate"
                        type="date"
                        defaultValue={finance.firstRevenueDate || ''}
                        className="col-span-2"
                        onBlur={(e) => updateFinanceData({ firstRevenueDate: e.target.value || undefined })}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="firstRevAmt">First Rev Amt (€)</Label>
                      <Input
                        id="firstRevAmt"
                        type="number"
                        defaultValue={finance.firstRevenueAmount || ''}
                        className="col-span-2"
                        onBlur={(e) =>
                          updateFinanceData({ firstRevenueAmount: parseFloat(e.target.value) || undefined })
                        }
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <span
              className={`text-2xl font-bold ${
                Number(runwayMonths) < 3 && runwayMonths !== '∞' ? 'text-red-500' : 'text-green-500'
              }`}
            >
              {runwayMonths} {t.chart.months}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={['auto', 'auto']}
                tickFormatter={formatXAxis}
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  value >= 1000 || value <= -1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
                }
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  value >= 1000 || value <= -1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
                }
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value: number) => [`${value.toFixed(0)} €`, '']}
                labelFormatter={(label) => formatXAxis(label)}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="income"
                name={formT.income}
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                yAxisId="left"
                dataKey="expense"
                name={formT.expense}
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="balance"
                name={t.chart.cash}
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
              />
              <ReferenceLine
                yAxisId="left"
                x={new Date().getTime()}
                stroke="#fbbf24"
                strokeDasharray="3 3"
                label={{ position: 'top', value: t.chart.today, fill: '#fbbf24', fontSize: 12 }}
              />
              {finance.targetMRR ? (
                <ReferenceLine
                  yAxisId="left"
                  y={finance.targetMRR}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    position: 'insideTopLeft',
                    value: t.chart.targetMRR || 'Target MRR',
                    fill: '#10b981',
                    fontSize: 12,
                  }}
                />
              ) : null}
              {finance.firstRevenueDate ? (
                <ReferenceLine
                  yAxisId="left"
                  x={new Date(finance.firstRevenueDate).getTime()}
                  stroke="#a855f7"
                  strokeDasharray="4 4"
                  label={{
                    position: 'top',
                    value: t.chart.firstRevenue || 'First Revenue',
                    fill: '#a855f7',
                    fontSize: 12,
                  }}
                />
              ) : null}
              <ReferenceLine yAxisId="right" y={0} stroke="#ef4444" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
