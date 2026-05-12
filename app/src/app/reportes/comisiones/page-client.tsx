'use client';

import { useEffect, useRef, useState } from 'react';
import { getCommissionReport } from '@/lib/db/queries';
import type { CommissionReportRow } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency, startOfMonth, formatDate } from '@/lib/utils';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar, 
  Search,
  UserRound,
  Briefcase,
  PiggyBank
} from 'lucide-react';

export default function ReportesComisionesPage({ initialData }: {
  initialData?: {
    rows: CommissionReportRow[];
    dateRange: { from: string; to: string };
  };
}) {
  const [rows, setRows] = useState<CommissionReportRow[]>(initialData?.rows || []);
  const [loading, setLoading] = useState(!initialData);
  const [search, setSearch] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const monthStart = startOfMonth().split('T')[0];
  
  const [dateRange, setDateRange] = useState(initialData?.dateRange || { from: monthStart, to: today });
  const skipInitialLoad = useRef(!!initialData);

  async function load() {
    setLoading(true);
    try {
      const data = await getCommissionReport(dateRange.from, dateRange.to);
      setRows(data as CommissionReportRow[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      return;
    }

    load();
  }, [dateRange]);

  const filtered = rows.filter((r) => {
    const s = search.toLowerCase();
    return (r.artist_name || '').toLowerCase().includes(s);
  });

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

  return (
    <>
      <Header title="Reportes / Comisiones" />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Ingreso Total" 
            value={formatCurrency(totalRevenue)} 
            icon={<DollarSign className="size-5" />} 
            color="salon" 
          />
          <StatCard 
            label="Comisión Artistas" 
            value={formatCurrency(totalArtistCommission)} 
            icon={<Users className="size-5" />} 
            color="accent" 
          />
          <StatCard 
            label="Share Founder" 
            value={formatCurrency(totalFounderShare)} 
            icon={<PiggyBank className="size-5" />} 
            color="green" 
          />
          <StatCard 
            label="Servicios Realizados" 
            value={totalServices} 
            icon={<Briefcase className="size-5" />} 
            color="blue" 
          />
        </div>

        <Card>
          <CardContent className="py-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Buscar artista..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
                  />
                </div>
                <div className="w-full sm:w-auto flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="text-sm h-full"
                  />
                  <span className="text-zinc-400 text-sm">al</span>
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="text-sm h-full"
                  />
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

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={'skel-' + i} className="h-24 rounded-2xl bg-zinc-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-zinc-400">
              <DollarSign className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {search ? 'No hay artistas que coincidan con tu búsqueda' : 'No hay datos de comisiones para este período'}
              </p>
            </CardContent>
          </Card>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((row) => {
              const isFounder = row.artist_role_name === 'Dueña' || row.artist_role_name === 'Founder';
              return (
                <Card key={row.artist_id || 'no-artist'} className="hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="py-5">
                    <div className="flex items-start gap-4">
                      <div className={`size-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                        isFounder ? 'bg-amber-100 text-amber-600' : 'bg-accent-100 text-accent-600'
                      }`}>
                        {(row.artist_name || 'S')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-zinc-900">{row.artist_name || 'Sin artista'}</p>
                          {isFounder && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                              Founder
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
                          <div>
                            <p className="text-xs text-zinc-400">Servicios</p>
                            <p className="font-semibold text-zinc-900">{row.total_services}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-400">Ingreso</p>
                            <p className="font-semibold text-zinc-900">{formatCurrency(row.total_service_revenue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-400">Comisión</p>
                            <p className="font-semibold text-accent-600">{formatCurrency(row.total_artist_commission)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-400">Share</p>
                            <p className="font-semibold text-emerald-600">{formatCurrency(row.total_founder_share)}</p>
                          </div>
                        </div>
                        {row.total_service_revenue > 0 && (
                          <div className="mt-3 pt-3 border-t border-zinc-100">
                            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                              <span>Distribución</span>
                              <span>
                                Artista: {Math.round((row.total_artist_commission / row.total_service_revenue) * 100)}% | Founder: {Math.round((row.total_founder_share / row.total_service_revenue) * 100)}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent-500 rounded-full transition-all"
                                style={{ width: `${Math.round((row.total_artist_commission / row.total_service_revenue) * 100)}%` }}
                              />
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
    </>
  );
}
