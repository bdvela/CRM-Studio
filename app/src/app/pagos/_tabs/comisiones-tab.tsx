'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { getCommissionReport } from '@/lib/db/queries';
import type { CommissionReportRow } from '@/types/database';
import { formatCurrency, startOfMonth, getLocalDateString } from '@/lib/utils';
import { CalendarInput } from '@/components/ui/CalendarInput';
import { DollarSign, Users, Search, Briefcase, PiggyBank } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ComisionesTab = memo(function ComisionesTab() {
  const { push } = useRouter();
  const [rows, setRows] = useState<CommissionReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);

  const today = getLocalDateString();
  const monthStart = startOfMonth().split('T')[0];
  const [dateRange, setDateRange] = useState({ from: monthStart, to: today });

  const load = useCallback(async () => {
    const { from, to } = dateRange;
    if (!from || !to) {
      setDateError(null);
      setRows([]);
      setLoading(false);
      return;
    }
    if (from > to) {
      setDateError('La fecha Desde no puede ser mayor que la fecha Hasta');
      setRows([]);
      setLoading(false);
      return;
    }
    setDateError(null);
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

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => (r.artist_name || '').toLowerCase().includes(search.toLowerCase()));
  const isFounderRow = (r: CommissionReportRow) => r.artist_role_name === 'Dueña' || r.artist_role_name === 'Founder';
  const totalRevenue = rows.reduce((sum, r) => sum + r.total_service_revenue, 0);
  const totalArtistCommission = rows.reduce((sum, r) => sum + (isFounderRow(r) ? 0 : r.total_artist_commission), 0);
  const totalFounderShare = rows.reduce((sum, r) => sum + (isFounderRow(r) ? r.total_service_revenue : r.total_founder_share), 0);
  const totalServices = rows.reduce((sum, r) => sum + r.total_services, 0);

  const setQuickRange = useCallback((days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateRange({ from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Cargando comisiones">
        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-100 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4" role="region" aria-label="Comisiones">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Resumen de comisiones">
        <div className="animate-fadeInUp rounded-2xl border border-zinc-200 bg-white shadow-sm" style={{ animationDelay: '0ms', opacity: 0 }}>
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
            <div className="size-8 sm:size-10 rounded-xl bg-salon-100 flex items-center justify-center flex-shrink-0">
              <DollarSign className="size-4 sm:size-5 text-salon-600" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">Ingreso Total</p>
              <p className="text-base sm:text-lg font-bold text-zinc-900 truncate">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="animate-fadeInUp rounded-2xl border border-zinc-200 bg-white shadow-sm" style={{ animationDelay: '50ms', opacity: 0 }}>
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
            <div className="size-8 sm:size-10 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
              <Users className="size-4 sm:size-5 text-accent-600" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">Comisión Artistas</p>
              <p className="text-base sm:text-lg font-bold text-accent-600 truncate">{formatCurrency(totalArtistCommission)}</p>
            </div>
          </div>
        </div>
        <div className="animate-fadeInUp rounded-2xl border border-zinc-200 bg-white shadow-sm" style={{ animationDelay: '100ms', opacity: 0 }}>
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
            <div className="size-8 sm:size-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <PiggyBank className="size-4 sm:size-5 text-amber-600" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">Studio</p>
              <p className="text-base sm:text-lg font-bold text-amber-600 truncate">{formatCurrency(totalFounderShare)}</p>
            </div>
          </div>
        </div>
        <div className="animate-fadeInUp rounded-2xl border border-zinc-200 bg-white shadow-sm" style={{ animationDelay: '150ms', opacity: 0 }}>
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
            <div className="size-8 sm:size-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Briefcase className="size-4 sm:size-5 text-blue-600" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">Servicios Realizados</p>
              <p className="text-base sm:text-lg font-bold text-zinc-900">{totalServices}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-3 sm:space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-zinc-400" aria-hidden="true" />
            <input type="text" placeholder="Buscar artista..." value={search} onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar artista"
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-zinc-200 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-salon-500" />
          </div>

          <div className="flex items-center justify-between gap-x-4 gap-y-2 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex-1 min-w-0 sm:flex-none">
                <CalendarInput
                  value={dateRange.from}
                  onChange={(v) => setDateRange(prev => ({ ...prev, from: v || '' }))}
                  placeholder="Desde"
                />
              </div>
              <span className="text-zinc-400 text-sm flex-shrink-0">al</span>
              <div className="flex-1 min-w-0 sm:flex-none">
                <CalendarInput
                  value={dateRange.to}
                  onChange={(v) => setDateRange(prev => ({ ...prev, to: v || '' }))}
                  placeholder="Hasta"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs text-zinc-500 mr-1">Rangos:</span>
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setQuickRange(days)}
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:scale-[0.97] transition-colors"
                >
                  {days === 7 ? '7 días' : days === 30 ? '30 días' : '90 días'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {dateError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700" role="alert">
          {dateError}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="py-10 text-center text-zinc-400">
            <DollarSign className="size-12 mx-auto mb-3 opacity-30" aria-hidden="true" />
            <p className="text-sm">{search ? 'No hay artistas que coincidan' : 'No hay datos de comisiones para este período'}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-live="polite" role="list" aria-label="Comisiones por artista">
          {filtered.map((row, i) => {
            const isFounder = row.artist_role_name === 'Dueña' || row.artist_role_name === 'Founder';
            const displayCommission = isFounder ? 0 : row.total_artist_commission;
            const displayStudio = isFounder ? row.total_service_revenue : row.total_founder_share;
            const handleKeyDown = (e: React.KeyboardEvent) => {
              if ((e.key === 'Enter' || e.key === ' ') && row.artist_id) {
                e.preventDefault();
                push(`/staff/${row.artist_id}`);
              }
            };
            return (
              <div key={row.artist_id || 'no-artist'} className="animate-fadeInUp" style={{ animationDelay: `${Math.min(i * 50, 300)}ms`, opacity: 0 }}>
                <div
                  onClick={() => row.artist_id ? push(`/staff/${row.artist_id}`) : undefined}
                  className="rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md hover:border-salon-300 transition-shadow active:scale-[0.97] cursor-pointer w-full box-border"
                  role="button"
                  tabIndex={0}
                  aria-label={`${row.artist_name || 'Sin artista'}: ${formatCurrency(displayCommission)} de comisión`}
                  onKeyDown={handleKeyDown}
                >
                  <div className="py-3 sm:py-5 px-3 sm:px-4">
                    <div className="flex items-start gap-2 sm:gap-4">
                      <div
                        className="size-9 sm:size-12 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold flex-shrink-0 shadow-md text-white"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${row.artist_role_color || '#db2777'}dd, ${row.artist_role_color || '#db2777'}88, ${row.artist_role_color || '#db2777'})`,
                          boxShadow: `0 4px 6px -1px ${(row.artist_role_color || '#db2777')}33`,
                        }}
                        aria-hidden="true"
                      >
                        {(row.artist_name || 'S')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-zinc-900 truncate max-w-[120px] sm:max-w-none">{row.artist_name || 'Sin artista'}</p>
                          {isFounder ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: row.artist_role_color || '#EC4899' }}
                            >Founder</span>
                          ) : row.artist_role_name ? (
                            <Badge variant="custom" color={row.artist_role_color || '#6B7280'} className="text-[10px] px-2 py-0.5">
                              {row.artist_role_name}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4 text-xs sm:text-sm">
                          <div><p className="text-[11px] sm:text-xs text-zinc-400">Servicios</p><p className="font-semibold text-zinc-900">{row.total_services}</p></div>
                          <div><p className="text-[11px] sm:text-xs text-zinc-400">Ingreso</p><p className="font-semibold text-zinc-900 tabular-nums truncate">{formatCurrency(row.total_service_revenue)}</p></div>
                          <div><p className="text-[11px] sm:text-xs text-zinc-400">Comisión</p><p className={`font-semibold tabular-nums truncate ${isFounder ? 'text-zinc-300' : 'text-accent-600'}`}>{formatCurrency(displayCommission)}</p></div>
                          <div><p className="text-[11px] sm:text-xs text-zinc-400">Studio</p><p className="font-semibold text-amber-600 tabular-nums truncate">{formatCurrency(displayStudio)}</p></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default ComisionesTab;
