'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCommissionReport } from '@/lib/db/queries';
import type { CommissionReportRow } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency, startOfMonth } from '@/lib/utils';
import { DollarSign, Users, TrendingUp, Search, Briefcase, PiggyBank } from 'lucide-react';

export default function ComisionesTab() {
  const { push } = useRouter();
  const [rows, setRows] = useState<CommissionReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const monthStart = startOfMonth().split('T')[0];
  const [dateRange, setDateRange] = useState({ from: monthStart, to: today });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCommissionReport(dateRange.from, dateRange.to);
      setRows(data as CommissionReportRow[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => (r.artist_name || '').toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = rows.reduce((sum, r) => sum + r.total_service_revenue, 0);
  const totalArtistCommission = rows.reduce((sum, r) => sum + r.total_artist_commission, 0);
  const totalFounderShare = rows.reduce((sum, r) => sum + r.total_founder_share, 0);
  const totalServices = rows.reduce((sum, r) => sum + r.total_services, 0);

  function setQuickRange(days: number) {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateRange({ from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] });
  }

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-100 animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ingreso Total" value={formatCurrency(totalRevenue)} icon={<DollarSign className="size-5" />} color="salon" />
        <StatCard label="Comisión Artistas" value={formatCurrency(totalArtistCommission)} icon={<Users className="size-5" />} color="accent" />
        <StatCard label="Share Founder" value={formatCurrency(totalFounderShare)} icon={<PiggyBank className="size-5" />} color="green" />
        <StatCard label="Servicios Realizados" value={totalServices} icon={<Briefcase className="size-5" />} color="blue" />
      </div>

      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
              <input type="text" placeholder="Buscar artista..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500" />
            </div>
            <div className="w-full sm:w-auto flex items-center gap-2">
              <Input type="date" value={dateRange.from} onChange={(v) => setDateRange(prev => ({ ...prev, from: v }))} className="text-sm h-full" />
              <span className="text-zinc-400 text-sm">al</span>
              <Input type="date" value={dateRange.to} onChange={(v) => setDateRange(prev => ({ ...prev, to: v }))} className="text-sm h-full" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-xs text-zinc-500">Rangos rápidos:</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setQuickRange(7)}>7 días</Button>
              <Button size="sm" variant="outline" onClick={() => setQuickRange(30)}>30 días</Button>
              <Button size="sm" variant="outline" onClick={() => setQuickRange(90)}>90 días</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-400">
            <DollarSign className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{search ? 'No hay artistas que coincidan' : 'No hay datos de comisiones para este período'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((row) => {
            const isFounder = row.artist_role_name === 'Dueña' || row.artist_role_name === 'Founder';
            return (
              <Card key={row.artist_id || 'no-artist'}
                onClick={() => row.artist_id ? push(`/staff/${row.artist_id}`) : undefined}
                className="hover:shadow-md transition-all cursor-pointer w-full box-border">
                <CardContent className="py-4 sm:py-5 px-3 sm:px-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`size-10 sm:size-12 rounded-full flex items-center justify-center text-base sm:text-lg font-bold flex-shrink-0 ${
                      isFounder ? 'bg-amber-100 text-amber-600' : 'bg-accent-100 text-accent-600'
                    }`}>
                      {(row.artist_name || 'S')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-zinc-900 truncate max-w-[120px] sm:max-w-none">{row.artist_name || 'Sin artista'}</p>
                        {isFounder && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">Founder</span>}
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-sm">
                        <div><p className="text-xs text-zinc-400">Servicios</p><p className="font-semibold text-zinc-900">{row.total_services}</p></div>
                        <div><p className="text-xs text-zinc-400">Ingreso</p><p className="font-semibold text-zinc-900">{formatCurrency(row.total_service_revenue)}</p></div>
                        <div><p className="text-xs text-zinc-400">Comisión</p><p className="font-semibold text-accent-600">{formatCurrency(row.total_artist_commission)}</p></div>
                        <div><p className="text-xs text-zinc-400">Share</p><p className="font-semibold text-emerald-600">{formatCurrency(row.total_founder_share)}</p></div>
                      </div>
                      {row.total_service_revenue > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-100">
                          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                            <span>Distribución</span>
                            <span>Artista: {Math.round((row.total_artist_commission / row.total_service_revenue) * 100)}% | Founder: {Math.round((row.total_founder_share / row.total_service_revenue) * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-500 rounded-full transition-all"
                              style={{ width: `${Math.round((row.total_artist_commission / row.total_service_revenue) * 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
