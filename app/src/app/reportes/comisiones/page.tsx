'use client';

import { useEffect, useState } from 'react';
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

export default function ReportesComisionesPage() {
  const [rows, setRows] = useState<CommissionReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const monthStart = startOfMonth().split('T')[0];
  
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);

  async function load() {
    setLoading(true);
    try {
      const data = await getCommissionReport(dateFrom, dateTo);
      setRows(data as CommissionReportRow[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [dateFrom, dateTo]);

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
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);
  }

  return (
    <>
      <Header title="Reportes / Comisiones" />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Ingreso Total" 
            value={formatCurrency(totalRevenue)} 
            icon={<DollarSign className="w-5 h-5" />} 
            color="salon" 
          />
          <StatCard 
            label="Comisión Artistas" 
            value={formatCurrency(totalArtistCommission)} 
            icon={<Users className="w-5 h-5" />} 
            color="accent" 
          />
          <StatCard 
            label="Share Founder" 
            value={formatCurrency(totalFounderShare)} 
            icon={<PiggyBank className="w-5 h-5" />} 
            color="green" 
          />
          <StatCard 
            label="Servicios Realizados" 
            value={totalServices} 
            icon={<Briefcase className="w-5 h-5" />} 
            color="blue" 
          />
        </div>

        <Card>
          <CardContent className="py-5">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setQuickRange(7)}>
                  Últimos 7 días
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuickRange(30)}>
                  Últimos 30 días
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuickRange(90)}>
                  Últimos 90 días
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3 ml-auto">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <Input 
                    type="date" 
                    value={dateFrom} 
                    onChange={(e) => setDateFrom(e.target.value)} 
                    className="w-40 text-sm" 
                  />
                  <span className="text-gray-400 text-sm">al</span>
                  <Input 
                    type="date" 
                    value={dateTo} 
                    onChange={(e) => setDateTo(e.target.value)} 
                    className="w-40 text-sm" 
                  />
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar artista..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {search ? 'No hay artistas que coincidan con tu búsqueda' : 'No hay datos de comisiones para este período'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((row) => {
              const isFounder = row.artist_name === 'Sofía Castillo';
              return (
                <Card key={row.artist_id || 'no-artist'} className={isFounder ? 'border-amber-200' : ''}>
                  <CardContent className="py-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                        isFounder ? 'bg-amber-100 text-amber-600' : 'bg-accent-100 text-accent-600'
                      }`}>
                        {(row.artist_name || 'S')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{row.artist_name || 'Sin artista'}</p>
                          {isFounder && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                              Founder
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                          <div>
                            <p className="text-xs text-gray-400">Servicios</p>
                            <p className="font-semibold text-gray-900">{row.total_services}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Ingreso</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(row.total_service_revenue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Comisión Artista</p>
                            <p className="font-semibold text-accent-600">{formatCurrency(row.total_artist_commission)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Share Founder</p>
                            <p className="font-semibold text-emerald-600">{formatCurrency(row.total_founder_share)}</p>
                          </div>
                        </div>

                        {row.total_service_revenue > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                              <span>Distribución</span>
                              <span>
                                Artista: {Math.round((row.total_artist_commission / row.total_service_revenue) * 100)}% | 
                                Founder: {Math.round((row.total_founder_share / row.total_service_revenue) * 100)}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
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
