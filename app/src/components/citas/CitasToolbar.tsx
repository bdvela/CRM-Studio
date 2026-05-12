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
      <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl w-full md:w-auto">
        <button
          onClick={() => onListFilterChange('list')}
          className={cn(
            'flex-1 md:flex-none px-3 py-2 text-sm font-medium rounded-lg transition-all',
            listFilter === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          Todas
        </button>
        <button
          onClick={() => onListFilterChange('day')}
          className={cn(
            'flex-1 md:flex-none px-3 py-2 text-sm font-medium rounded-lg transition-all',
            listFilter === 'day' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          Hoy
        </button>
        <button
          onClick={() => onListFilterChange('week')}
          className={cn(
            'flex-1 md:flex-none px-3 py-2 text-sm font-medium rounded-lg transition-all',
            listFilter === 'week' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
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
