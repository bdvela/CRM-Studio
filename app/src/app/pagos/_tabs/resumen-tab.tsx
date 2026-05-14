'use client';

import { useEffect, useState, useCallback } from 'react';
import { getFinancialSummary, getIncomeByMethod, getExpensesByCategory } from '@/lib/db/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency, startOfMonth } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS, PAYMENT_CATEGORY_LABELS } from '@/types/database';
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Calendar } from 'lucide-react';

type QuickRange = '7d' | '30d' | 'thisMonth' | '90d' | 'custom';

function getDateRange(range: QuickRange): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  switch (range) {
    case '7d': from.setDate(from.getDate() - 7); break;
    case '30d': from.setDate(from.getDate() - 30); break;
    case 'thisMonth': return { from: startOfMonth().split('T')[0], to: to.toISOString().split('T')[0] };
    case '90d': from.setDate(from.getDate() - 90); break;
  }
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
}

export default function ResumenTab() {
  const [range, setRange] = useState<QuickRange>('thisMonth');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [incomeByMethod, setIncomeByMethod] = useState<any[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dateRange = range === 'custom' ? { from: customFrom, to: customTo } : getDateRange(range);
      if (!dateRange.from || !dateRange.to) return;
      const [sum, byMethod, byCat] = await Promise.all([
        getFinancialSummary(dateRange.from, dateRange.to),
        getIncomeByMethod(dateRange.from, dateRange.to),
        getExpensesByCategory(dateRange.from, dateRange.to),
      ]);
      setSummary(sum);
      setIncomeByMethod(byMethod as any[]);
      setExpensesByCategory(byCat as any[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [range, customFrom, customTo]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const incomePercent = summary && (summary.totalIncome + summary.totalExpenses) > 0
    ? Math.round((summary.totalIncome / (summary.totalIncome + summary.totalExpenses)) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-zinc-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
              {(['7d', '30d', 'thisMonth', '90d'] as QuickRange[]).map((r) => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    range === r ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                  }`}>
                  {r === '7d' ? '7 días' : r === '30d' ? '30 días' : r === 'thisMonth' ? 'Este mes' : '90 días'}
                </button>
              ))}
            </div>
            <button onClick={() => setRange('custom')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                range === 'custom' ? 'bg-salon-50 text-salon-700' : 'text-zinc-500 hover:text-zinc-700'
              }`}>
              <Calendar className="size-4 inline mr-1" /> Personalizado
            </button>
          </div>
          {range === 'custom' && (
            <div className="flex items-center gap-2 mt-3">
              <Input type="date" value={customFrom} onChange={setCustomFrom} className="text-sm" />
              <span className="text-zinc-400">—</span>
              <Input type="date" value={customTo} onChange={setCustomTo} className="text-sm" />
            </div>
          )}
        </CardContent>
      </Card>

      {summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Ingresos" value={formatCurrency(summary.totalIncome)} icon={<TrendingUp className="size-5" />} color="green" />
            <StatCard label="Egresos" value={formatCurrency(summary.totalExpenses)} icon={<TrendingDown className="size-5" />} color="blue" />
            <StatCard label="Ganancia Neta" value={formatCurrency(summary.netProfit)} icon={<PiggyBank className="size-5" />} color={summary.netProfit >= 0 ? 'green' : 'accent'} />
          </div>

          {(summary.totalIncome + summary.totalExpenses) > 0 && (
            <Card>
              <CardContent className="py-4">
                <p className="text-sm font-medium text-zinc-700 mb-3">Distribución Ingresos vs Egresos</p>
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                  <span className="text-green-600">Ingresos: {incomePercent}%</span>
                  <span className="text-red-600">Egresos: {100 - incomePercent}%</span>
                </div>
                <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${incomePercent}%` }} />
                  <div className="h-full bg-red-500 transition-all" style={{ width: `${100 - incomePercent}%` }} />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-sm font-semibold text-zinc-700 mb-4">Ingresos por método de pago</p>
                {incomeByMethod.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-6">Sin ingresos en este período</p>
                ) : (
                  <div className="space-y-2">
                    {incomeByMethod.map((item) => {
                      const pct = summary.totalIncome > 0 ? Math.round((item.total / summary.totalIncome) * 100) : 0;
                      return (
                        <div key={item.method} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-zinc-900">{PAYMENT_METHOD_LABELS[item.method as keyof typeof PAYMENT_METHOD_LABELS] || item.method}</span>
                            <span className="font-semibold text-green-600">{formatCurrency(item.total)}</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm font-semibold text-zinc-700 mb-4">Egresos por categoría</p>
                {expensesByCategory.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-6">Sin egresos en este período</p>
                ) : (
                  <div className="space-y-2">
                    {expensesByCategory.map((item) => {
                      const pct = summary.totalExpenses > 0 ? Math.round((item.total / summary.totalExpenses) * 100) : 0;
                      return (
                        <div key={item.category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-zinc-900">{PAYMENT_CATEGORY_LABELS[item.category as keyof typeof PAYMENT_CATEGORY_LABELS] || item.category}</span>
                            <span className="font-semibold text-red-600">{formatCurrency(item.total)}</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-zinc-400">
            <DollarSign className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay datos financieros para este período</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
