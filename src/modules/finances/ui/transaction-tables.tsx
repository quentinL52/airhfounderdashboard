'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useFounderStore, ExpenseItem, ExpenseCategory } from '@/store/founder-store';
import { translations } from '@/lib/translations';
import { useGamification } from '@/hooks/use-gamification';
import { toast } from '@/hooks/use-toast';
import { Timeframe } from './runway-chart';
import { getMonthlyEntries } from '../domain/cashflow-calculations';

// --- 1. RecurringExpensesList ---
export function RecurringExpensesList() {
  const finance = useFounderStore((s) => s.finance);
  const deleteEntry = useFounderStore((s) => s.deleteEntry);

  const { recurringExpenses } = useMemo(() => {
    const today = new Date();
    const currentMonthStr = format(today, 'yyyy-MM');

    const sortedEntries = [...getMonthlyEntries(finance.entries)].sort((a, b) => b.month.localeCompare(a.month));
    const latestEntry = sortedEntries.find((e) => e.month === currentMonthStr) || sortedEntries[0];

    if (!latestEntry) return { recurringExpenses: [], latestMonthId: null };

    const activeRecurring = (latestEntry.expenses || []).filter((e) => {
      const isMonthly = e.frequency === 'monthly';
      const isAnnual = e.frequency === 'annual';
      return isMonthly || isAnnual;
    });

    return { recurringExpenses: activeRecurring, latestMonthId: latestEntry.id };
  }, [finance]);

  if (recurringExpenses.length === 0) {
    return null;
  }

  const handleDelete = (id: string) => {
    deleteEntry(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Dépenses Récurrentes Actives</CardTitle>
        <CardDescription className="text-gray-300">
          Abonnements et charges fixes du mois courant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-slate-400">Description</TableHead>
              <TableHead className="text-slate-400">Catégorie</TableHead>
              <TableHead className="text-slate-400">Fréquence</TableHead>
              <TableHead className="text-right text-slate-400">Montant</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recurringExpenses.map((expense) => {
              const isAnnual = expense.frequency === 'annual';
              const freqLabel = isAnnual ? 'Annuel' : 'Mensuel';
              const badgeColor = isAnnual
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                : 'bg-blue-500/20 text-blue-400 border-blue-500/50';

              return (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium text-slate-200">{expense.label}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-slate-300 border-slate-700">
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={badgeColor}>
                      {freqLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-200">
                    <div className="font-medium">{expense.amount} €</div>
                    {isAnnual && (
                      <div className="text-xs text-slate-500">
                        soit {(expense.amount / 12).toFixed(1)} € / mois
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// --- 2. FinanceEntryForm ---
const expenseSchema = z.object({
  label: z.string().min(2, 'Label must be at least 2 characters'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  category: z.string(),
  type: z.enum(['expense', 'revenue']),
  date: z.string().min(1, 'Date is required'),
  frequency: z.enum(['monthly', 'annual', 'one-time']).default('monthly'),
});

export function FinanceEntryForm() {
  const finance = useFounderStore((s) => s.finance);
  const updateCashAvailable = useFounderStore((s) => s.updateCashAvailable);
  const addEntry = useFounderStore((s) => s.addEntry);

  const language = useFounderStore((s) => s.language);
  const t = translations[language].finance.form;
  const [cashInput, setCashInput] = useState(finance.cashAvailable.toString());

  const processCashUpdate = () => {
    const val = parseFloat(cashInput);
    if (!isNaN(val)) {
      updateCashAvailable(val);
    }
  };

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      label: '',
      amount: 0,
      category: 'Divers',
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      frequency: 'monthly',
    },
  });

  const { awardXP } = useGamification();

  const onSubmit = (values: z.infer<typeof expenseSchema>) => {
    addEntry({
      label: values.label,
      amount: values.amount,
      category: values.type === 'expense' ? values.category : 'other',
      frequency: values.frequency as any,
      type: values.type === 'revenue' ? 'income' : 'expense',
      date: values.date,
    });

    if (values.type === 'revenue' && values.amount > 0) {
      awardXP('first_revenue');
    }

    form.reset({
      label: '',
      amount: 0,
      category: 'Divers',
      type: 'expense',
      date: values.date,
      frequency: 'one-time',
    });
    toast({
      title: language === 'fr' ? 'Succès' : 'Success',
      description: language === 'fr' ? 'Opération ajoutée avec succès' : 'Entry added successfully',
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle className="text-foreground">{translations[language].finance.chart.cash}</CardTitle>
          <CardDescription className="text-gray-300">Update your current bank balance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="cash" className="text-foreground">
                {t.amount} (€)
              </Label>
              <Input
                id="cash"
                type="number"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={processCashUpdate} className="w-full bg-white text-black hover:bg-gray-200">
            Update Balance
          </Button>
        </CardFooter>
      </Card>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle className="text-foreground">{t.title}</CardTitle>
          <CardDescription className="text-gray-300">
            Add a recurring expense or revenue for this month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">{t.date}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">{t.type}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="expense">{t.expense}</SelectItem>
                          <SelectItem value="revenue">{t.income}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">{t.amount} (€)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">{t.description}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Hosting" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        {language === 'fr' ? 'Fréquence' : 'Frequency'}
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">{language === 'fr' ? 'Mensuel' : 'Monthly'}</SelectItem>
                          <SelectItem value="annual">{language === 'fr' ? 'Annuel' : 'Annual'}</SelectItem>
                          <SelectItem value="one-time">{language === 'fr' ? 'Ponctuel' : 'One-time'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">{t.category}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={form.watch('type') === 'revenue'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="API IA">API IA</SelectItem>
                          <SelectItem value="Auth & Data">Auth & Data</SelectItem>
                          <SelectItem value="Observabilité">Observabilité</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="Outils SaaS">Outils SaaS</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Divers">Divers</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200">
                <Plus className="mr-2 h-4 w-4" /> {t.submit}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// --- 3. FinanceTable ---
interface FlatEntry extends ExpenseItem {
  monthId: string;
  monthLabel: string;
  type: 'expense' | 'income';
  isHeader?: boolean;
  headerLabel?: string;
}

interface FinanceTableProps {
  timeframe: Timeframe;
}

export function FinanceTable({ timeframe }: FinanceTableProps) {
  const finance = useFounderStore((s) => s.finance);
  const deleteEntry = useFounderStore((s) => s.deleteEntry);
  const updateEntry = useFounderStore((s) => s.updateEntry);
  const language = useFounderStore((s) => s.language);
  const t = translations[language].finance.table;
  const common = translations[language].common;
  const formT = translations[language].finance.form;

  const [deleteId, setDeleteId] = useState<{ monthId: string; entryId: string; type: 'expense' | 'income' } | null>(
    null
  );
  const [editingEntry, setEditingEntry] = useState<FlatEntry | null>(null);

  const entries: FlatEntry[] = useMemo(() => {
    const entriesToMap = Array.isArray(finance.entries) ? finance.entries : [];
    const allEntries: FlatEntry[] = entriesToMap
      .map((e) => ({
        ...e,
        monthId: e.id,
        monthLabel: e.date.substring(0, 7),
        type: e.type,
        date: e.date,
      }))
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

    const grouped: FlatEntry[] = [];
    let lastHeaderValue = '';

    allEntries.forEach((entry) => {
      const date = new Date(entry.date!);
      let headerValue = '';
      let headerLabel = '';

      switch (timeframe) {
        case 'week':
          const start = startOfWeek(date, { weekStartsOn: 1 });
          const end = endOfWeek(date, { weekStartsOn: 1 });
          headerValue = format(start, 'yyyy-ww');
          headerLabel = `Week of ${format(start, 'd MMM')} - ${format(end, 'd MMM')}`;
          break;
        case 'month':
          headerValue = format(date, 'yyyy-MM');
          headerLabel = format(date, 'MMMM yyyy');
          break;
        case 'quarter':
          const q = Math.floor((date.getMonth() + 3) / 3);
          headerValue = `${date.getFullYear()}-Q${q}`;
          headerLabel = `Q${q} ${date.getFullYear()}`;
          break;
        case 'year':
          headerValue = format(date, 'yyyy');
          headerLabel = format(date, 'yyyy');
          break;
      }

      if (headerValue !== lastHeaderValue) {
        grouped.push({
          id: `header-${headerValue}`,
          label: '',
          amount: 0,
          category: 'Divers',
          frequency: 'one-time',
          monthId: '',
          monthLabel: '',
          type: 'expense',
          isHeader: true,
          headerLabel,
          date: '',
        });
        lastHeaderValue = headerValue;
      }
      grouped.push(entry);
    });

    return grouped;
  }, [finance, timeframe]);

  const handleDelete = () => {
    if (deleteId) {
      deleteEntry(deleteId.entryId);
      setDeleteId(null);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      updateEntry(editingEntry.id, {
        label: editingEntry.label,
        amount: editingEntry.amount,
        category: editingEntry.category,
        date: editingEntry.date,
        frequency: editingEntry.frequency,
      });
      setEditingEntry(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-400">{t.date}</TableHead>
              <TableHead className="text-gray-400">{t.description}</TableHead>
              <TableHead className="text-gray-400">{formT.type}</TableHead>
              <TableHead className="text-gray-400">{t.category}</TableHead>
              <TableHead className="text-right text-gray-400">{t.amount}</TableHead>
              <TableHead className="text-right text-gray-400">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  No entries found.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                if (entry.isHeader) {
                  return (
                    <TableRow key={entry.id} className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={6} className="text-foreground font-bold py-3 pl-4">
                        {entry.headerLabel}
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="text-gray-300">{entry.date}</TableCell>
                    <TableCell className="text-gray-300">{entry.label}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            entry.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {entry.type === 'income' ? formT.income : formT.expense}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          {entry.frequency === 'annual'
                            ? language === 'fr'
                              ? 'Annuel'
                              : 'Annual'
                            : entry.frequency === 'monthly'
                            ? language === 'fr'
                              ? 'Mensuel'
                              : 'Monthly'
                            : language === 'fr'
                            ? 'Ponctuel'
                            : 'One-time'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-gray-300">{entry.category}</TableCell>
                    <TableCell className="text-right font-mono text-gray-300">{entry.amount.toFixed(2)} €</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-foreground hover:bg-slate-800"
                          onClick={() => setEditingEntry(entry)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() =>
                            setDeleteId({
                              monthId: entry.monthId,
                              entryId: entry.id,
                              type: entry.type,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{translations.en.common.error}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-black bg-white hover:bg-gray-200">{common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-foreground hover:bg-red-700">
              {common.delete || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Entry</DialogTitle>
            <DialogDescription className="text-gray-300">Make changes to your financial entry here.</DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <form onSubmit={handleUpdate} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right text-gray-300">
                  {t.date}
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={editingEntry.date}
                  onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="label" className="text-right text-gray-300">
                  {t.description}
                </Label>
                <Input
                  id="label"
                  value={editingEntry.label}
                  onChange={(e) => setEditingEntry({ ...editingEntry, label: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right text-gray-300">
                  {t.amount}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={editingEntry.amount}
                  onChange={(e) => setEditingEntry({ ...editingEntry, amount: parseFloat(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right text-gray-300">
                  {t.category}
                </Label>
                <div className="col-span-3">
                  <Select
                    value={editingEntry.category}
                    onValueChange={(val) => setEditingEntry({ ...editingEntry, category: val as ExpenseCategory })}
                    disabled={editingEntry.type === 'income'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="API IA">API IA</SelectItem>
                      <SelectItem value="Auth & Data">Auth & Data</SelectItem>
                      <SelectItem value="Observabilité">Observabilité</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Outils SaaS">Outils SaaS</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Divers">Divers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right text-gray-300">
                  {language === 'fr' ? 'Fréquence' : 'Frequency'}
                </Label>
                <div className="col-span-3">
                  <Select
                    value={editingEntry.frequency || 'one-time'}
                    onValueChange={(val) => setEditingEntry({ ...editingEntry, frequency: val as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{language === 'fr' ? 'Mensuel' : 'Monthly'}</SelectItem>
                      <SelectItem value="annual">{language === 'fr' ? 'Annuel' : 'Annual'}</SelectItem>
                      <SelectItem value="one-time">{language === 'fr' ? 'Ponctuel' : 'One-time'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-white text-black hover:bg-gray-200">
                  {formT.submit}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
