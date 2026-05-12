'use client';

import { useMemo } from 'react';
import type { AppointmentFormModalContentProps } from './types';
import { getAvailableArtistsForService } from './helpers';
import { formatCurrency, cn } from '@/lib/utils';
import { ClientCombobox } from '@/components/citas/ClientCombobox';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Plus, AlertTriangle, Settings2, Trash2 } from 'lucide-react';

const COLOR_OPTIONS = [
  { value: '', label: 'Auto', bg: 'bg-gradient-to-br from-zinc-200 to-zinc-300' },
  { value: 'rose', label: 'Rosa', bg: 'bg-rose-500' },
  { value: 'violet', label: 'Violeta', bg: 'bg-violet-500' },
  { value: 'blue', label: 'Azul', bg: 'bg-blue-500' },
  { value: 'emerald', label: 'Verde', bg: 'bg-emerald-500' },
  { value: 'amber', label: 'Ámbar', bg: 'bg-amber-500' },
  { value: 'cyan', label: 'Cian', bg: 'bg-cyan-500' },
  { value: 'pink', label: 'Fucsia', bg: 'bg-pink-500' },
  { value: 'teal', label: 'Teal', bg: 'bg-teal-500' },
  { value: 'red', label: 'Rojo', bg: 'bg-red-500' },
  { value: 'orange', label: 'Naranja', bg: 'bg-orange-500' },
  { value: 'indigo', label: 'Índigo', bg: 'bg-indigo-500' },
];

export function AppointmentFormModalContent({
  open, editingAppt, form, clients, selectedServices, serviceArtists, customPrices,
  services, staff, overlapWarning, advancePaid, submitting, canDelete,
  totalDuration, haveChanges, calculateTotalPrice,
  onFormChange, onStartTimeChange, onSubmit, onDelete, onClose,
  onOpenServiceSelector, onOpenServiceConfig, onToggleAdvancePaid,
}: AppointmentFormModalContentProps) {
  const serviceById = useMemo(() => new Map(services.map((svc) => [svc.id, svc])), [services]);
  const totalPrice = calculateTotalPrice();

  if (!open) return null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ClientCombobox value={form.client_id} onChange={(id) => onFormChange({ client_id: id })} initialClients={clients} />
      <DateTimePicker value={form.start_time} onChange={onStartTimeChange} />

      <div className="space-y-2">
        <span className="block text-sm font-medium text-zinc-700">Servicios</span>
        <button
          type="button"
          onClick={onOpenServiceSelector}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-300 text-zinc-600 hover:border-salon-300 hover:text-salon-600 hover:bg-salon-50 transition-all"
        >
          <Plus className="size-5" />
          <span className="text-sm font-medium">Agregar servicio</span>
        </button>
      </div>

      {selectedServices.length > 0 && (
        <>
          <div className="border-t-2 border-salon-200 pt-3 mt-1">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-sm font-semibold text-zinc-700">
                📋 Servicios seleccionados ({selectedServices.length})
              </span>
            </div>
            <div className="space-y-2">
              {selectedServices.map((svcId) => {
                const svc = serviceById.get(svcId);
                if (!svc) return null;

                const availableArtists = getAvailableArtistsForService(svc.id, svc.category_id, staff, services);
                const isVariablePrice = svc.price_type === 'variable';
                const catIcon = svc.category?.icon || '📋';
                const isInactive = svc.active === false;

                const suggestedArtistIds = availableArtists.map(a => a.id);
                const selectedArtistId = serviceArtists[svcId];
                const selectedArtist = staff.find(s => s.id === selectedArtistId);
                const isSelectedArtistSuggested = selectedArtistId && suggestedArtistIds.includes(selectedArtistId);

                const currentPrice = customPrices[svcId] ?? (isVariablePrice ? (svc.price_from || 0) : (svc.price || 0));

                return (
                  <div key={svcId} className={cn(
                    "border border-zinc-200 rounded-xl p-3 bg-zinc-50",
                    isInactive && "opacity-60"
                  )}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{catIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-900 truncate">{svc.name}</p>
                          {isInactive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-500 font-medium">Inactivo</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {selectedArtist ? (
                            <span className={cn("text-xs", isSelectedArtistSuggested ? "text-salon-600" : "text-zinc-500")}>
                              {selectedArtist.name}
                              {isSelectedArtistSuggested && <span className="ml-1 text-salon-500">(sugerida)</span>}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="size-3" /> Sin artista
                            </span>
                          )}
                          <span className="text-xs text-zinc-400">{svc.duration_min} min</span>
                          <span className={cn("text-sm font-semibold", isVariablePrice ? "text-amber-600" : "text-zinc-700")}>
                            {formatCurrency(currentPrice)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenServiceConfig(svcId)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-salon-600 hover:bg-salon-100 transition-colors"
                      >
                        <Settings2 className="size-4" /> Configurar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-xl bg-salon-50">
            <div className="flex items-center gap-1.5 text-sm text-salon-700">
              <Clock className="size-4" /> {totalDuration} min
            </div>
            <div className="text-sm font-semibold text-salon-700">
              {formatCurrency(totalPrice)}
            </div>
          </div>
        </>
      )}

      {overlapWarning && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-700 text-sm">
          <AlertTriangle className="size-4 flex-shrink-0" />
          {overlapWarning}
        </div>
      )}

      <div className="space-y-2">
        <span className="block text-sm font-medium text-zinc-700">Color</span>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onFormChange({ color: c.value })}
              className={cn(
                'size-8 rounded-full transition-all border-2',
                c.bg,
                form.color === c.value ? 'border-zinc-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'
              )}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {!editingAppt && (
        <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-700">Adelanto de S/20</span>
            <span className="text-xs text-zinc-500">(para separar la cita)</span>
          </div>
          <button
            type="button"
            onClick={onToggleAdvancePaid}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-salon-500 focus-visible:ring-offset-2",
              advancePaid ? "bg-salon-600" : "bg-zinc-200"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                advancePaid ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      )}

      <Textarea label="Notas" value={form.notes} onChange={(value) => onFormChange({ notes: value })} placeholder="Notas especiales..." maxLength={500} />

      <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 mt-2 border-t border-zinc-100">
        {canDelete && (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 order-last sm:order-none"
            onClick={onDelete}
          >
            <Trash2 className="size-4 mr-1" /> Eliminar
          </Button>
        )}
        <div className="hidden sm:block flex-1" />
        <div className="flex flex-1 sm:flex-none gap-2 order-first sm:order-none">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="flex-1" loading={submitting} disabled={!form.start_time || (editingAppt && !haveChanges())}>
            {submitting ? 'Guardando...' : (editingAppt ? 'Actualizar' : 'Crear cita')}
          </Button>
        </div>
      </div>
    </form>
  );
}
