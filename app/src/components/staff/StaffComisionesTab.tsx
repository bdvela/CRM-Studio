'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { StaffComisionesTabProps } from './types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Search, Plus, X, DollarSign, TrendingUp, ExternalLink } from 'lucide-react';

export function StaffComisionesTab({
  isOwner,
  editingMember,
  form,
  dispatch,
  services,
  overrides,
  setOverrides,
}: StaffComisionesTabProps) {
  const [overrideSearch, setOverrideSearch] = useState('');
  const [overrideDropdownOpen, setOverrideDropdownOpen] = useState(false);
  const overrideDropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (overrideDropdownRef.current && !overrideDropdownRef.current.contains(e.target as Node)) {
      setOverrideDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const filteredServices = services.filter(
    (svc) =>
      svc.name.toLowerCase().includes(overrideSearch.toLowerCase()) &&
      !overrides[svc.id]
  );

  return (
    <div className="space-y-4 pt-2">
      {isOwner ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-emerald-800">
              Founder / Dueña
            </span>
          </div>
          <p className="text-xs text-emerald-700">
            La Founder recibe el <strong>100%</strong> de todas las comisiones. Este valor no es modificable.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label htmlFor="staff-comision" className="block text-sm font-medium text-zinc-700">
              <DollarSign className="size-4 inline mr-1" aria-hidden="true" />
              Comisión General (%)
            </label>
            <Input
              id="staff-comision"
              type="number"
              value={form.commission_pct}
              onChange={(value) => dispatch({ type: 'UPDATE', payload: { commission_pct: parseFloat(value) || 0 } })}
              placeholder="Ej: 70"
              min={0}
              max={100}
            />
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1">
              <p className="text-sm text-zinc-700">
                Ejemplo rápido:
              </p>
              <p className="text-xs text-zinc-500">
                Si un servicio cuesta <strong>S/ 100.00</strong> y la comisión es <strong>{form.commission_pct}%</strong>:
              </p>
              <div className="flex gap-4 text-xs mt-2">
                <span className="text-accent-600">
                  ✓ Artista recibe: <strong>{formatCurrency(Math.round(100 * (form.commission_pct || 0)) / 100)}</strong>
                </span>
                <span className="text-emerald-600">
                  ✓ Founder recibe: <strong>{formatCurrency(100 - Math.round(100 * (form.commission_pct || 0)) / 100)}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-zinc-700">
                Excepciones por servicio
              </p>
              {Object.keys(overrides).length > 0 && (
                <span className="text-xs text-zinc-500">
                  {Object.keys(overrides).length} excepcion(es)
                </span>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
              <p className="text-xs text-amber-700">
                Para servicios especiales, define un <strong>MONTO FIJO</strong> que recibe la Founder en lugar del porcentaje.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Ejemplo: Pedicura (S/ 50) → Founder recibe S/ 5 fijo → Artista recibe S/ 45.
              </p>
            </div>

            <div ref={overrideDropdownRef} className="relative mb-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" aria-hidden="true" />
                  <input
                    type="text"
                    value={overrideSearch}
                    onChange={(e) => {
                      setOverrideSearch(e.target.value);
                      setOverrideDropdownOpen(true);
                    }}
                    onFocus={() => setOverrideDropdownOpen(true)}
                    placeholder="Buscar servicio para agregar excepción..."
                    className="w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent"
                    aria-label="Buscar servicio para excepción de comisión"
                  />
                </div>
              </div>

              {overrideDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-zinc-200 shadow-lg max-h-64 overflow-y-auto">
                  {overrideSearch.trim() && filteredServices.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-zinc-400">No hay servicios que coincidan</p>
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-zinc-400">
                        {services.length - Object.keys(overrides).length} servicio(s) disponibles
                      </p>
                    </div>
                  ) : (
                    filteredServices.slice(0, 10).map((svc) => (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => {
                          setOverrides((prev) => ({ ...prev, [svc.id]: 0 }));
                          setOverrideSearch('');
                          setOverrideDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{svc.name}</p>
                          <p className="text-xs text-zinc-500">
                            Precio: {formatCurrency(svc.price)}
                            {svc.category && (
                              <span className="ml-2">• {svc.category.name}</span>
                            )}
                          </p>
                        </div>
                        <Plus className="size-4 text-zinc-400" aria-hidden="true" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {Object.keys(overrides).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(overrides).map(([serviceId, fixedAmount]) => {
                  const svc = services.find((s) => s.id === serviceId);
                  if (!svc) return null;

                  return (
                    <div
                      key={serviceId}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border bg-emerald-50 border-emerald-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{svc.name}</p>
                        <p className="text-xs text-zinc-500">
                          Precio: {formatCurrency(svc.price)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-xs text-emerald-700 font-medium hidden sm:inline">Founder:</span>
<Input
  className="w-20 sm:w-24 text-center text-sm"
  type="number"
  placeholder="0"
  min={0}
  max={svc.price}
  value={fixedAmount ?? ''}
                            onChange={(value) => {
                              setOverrides((prev) => ({
                                ...prev,
                                [serviceId]: value === '' ? null : parseFloat(value),
                              }));
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOverrides((prev) => {
                              const next = { ...prev };
                              delete next[serviceId];
                              return next;
                            });
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                          title="Quitar excepción"
                          aria-label={`Quitar excepción de ${svc.name}`}
                        >
                          <X className="size-4 text-zinc-400 hover:text-red-500" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-zinc-200 rounded-xl">
                <p className="text-sm text-zinc-400">No hay excepciones configuradas</p>
                <p className="text-xs text-zinc-400 mt-1">Usa el buscador de arriba para agregar</p>
              </div>
            )}
          </div>
        </>
      )}

      {editingMember && (
        <div className="border-t border-zinc-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-zinc-700">
              <TrendingUp className="size-4 inline mr-1" aria-hidden="true" />
              Resumen
            </p>
            <button
              type="button"
              onClick={() => window.location.href = '/reportes/comisiones'}
              className="text-xs text-salon-600 hover:text-salon-700 font-medium flex items-center gap-1"
            >
              Ver reporte completo
              <ExternalLink className="size-3" aria-hidden="true" />
            </button>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
            {editingMember.staff_stats ? (
              <>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-zinc-500">Citas</p>
                    <p className="font-semibold text-zinc-900">{editingMember.staff_stats.total_appointments}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Ingreso</p>
                    <p className="font-semibold text-zinc-900">
                      {formatCurrency(editingMember.staff_stats.total_revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Comisión %</p>
                    <p className="font-semibold text-accent-600">
                      {editingMember.commission_pct}%
                    </p>
                  </div>
                </div>
                {editingMember.last_commission_paid && (
                  <div className="pt-3 border-t border-zinc-200">
                    <p className="text-xs text-zinc-500">
                      Última comisión pagada: <strong>{formatDate(editingMember.last_commission_paid)}</strong>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-zinc-400 text-center">
                Aún no hay datos históricos para este miembro.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
