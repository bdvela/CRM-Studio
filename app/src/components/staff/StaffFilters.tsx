'use client';

import { memo } from 'react';
import type { StaffFiltersProps } from './types';
import { Search } from 'lucide-react';

export const StaffFilters = memo(function StaffFilters({ search, onSearchChange }: StaffFiltersProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400" aria-hidden="true" />
      <input
        type="text"
        placeholder="Buscar por nombre, rol o teléfono..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent"
        aria-label="Buscar miembro del staff"
      />
    </div>
  );
});
