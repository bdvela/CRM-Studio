'use client';

import type { CitasToolbarProps } from './types';
import { cn } from '@/lib/utils';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { Select } from '@/components/ui/select';

export function CitasToolbar({
  viewMode, listFilter, filterArtist, filterStatus,
  staff, appointments,
  onViewModeChange, onListFilterChange,
  onFilterArtistChange, onFilterStatusChange, onClearFilters,
}: CitasToolbarProps) {
  const artistOptions: { value: string; label: string }[] = [];
  for (const s of staff) {
    if (s.active) artistOptions.push({ value: s.id, label: s.name });
  }

  const statusOptions = Object.entries(APPOINTMENT_STATUS_LABELS).map(([v, l]) => ({
    value: v, label: l,
  }));

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
      <div className="flex items-center gap-1 p-1 bg-white/20 backdrop-blur-sm rounded-xl w-full md:w-auto border border-t-white/50 border-b-white/20 border-l-white/30 border-r-white/30 shadow-sm">
        <button
          onClick={() => onListFilterChange('list')}
          className={cn(
            'flex-1 md:flex-none px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300',
            listFilter === 'list' ? 'bg-white/60 backdrop-blur-sm text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-t-white/60 border-b-white/20' : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          Todas
        </button>
        <button
          onClick={() => onListFilterChange('day')}
          className={cn(
            'flex-1 md:flex-none px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300',
            listFilter === 'day' ? 'bg-white/60 backdrop-blur-sm text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-t-white/60 border-b-white/20' : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          Hoy
        </button>
        <button
          onClick={() => onListFilterChange('week')}
          className={cn(
            'flex-1 md:flex-none px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300',
            listFilter === 'week' ? 'bg-white/60 backdrop-blur-sm text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-t-white/60 border-b-white/20' : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          Semana
        </button>
      </div>

      <div className="w-full md:w-44">
        <Select
          value={filterArtist}
          onChange={onFilterArtistChange}
          options={artistOptions}
          placeholder="Todas las artistas"
        />
      </div>

      <div className="w-full md:w-44">
        <Select
          value={filterStatus}
          onChange={onFilterStatusChange}
          options={statusOptions}
          placeholder="Todos los estados"
        />
      </div>

      <div className="flex items-center justify-between gap-3 w-full">
        {(filterArtist || filterStatus) ? (
          <button
            onClick={onClearFilters}
            className="text-xs text-salon-600 hover:text-salon-700 font-medium"
          >
            Limpiar filtros
          </button>
        ) : <span />}
        <span className="text-sm text-zinc-400">
          {appointments.length} cita{appointments.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
