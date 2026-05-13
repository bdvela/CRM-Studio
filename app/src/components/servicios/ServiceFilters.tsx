'use client';

import { memo } from 'react';
import { Search } from 'lucide-react';
import { Select } from '@/components/ui/select';
import type { ServiceFiltersProps } from './types';

export const ServiceFilters = memo(function ServiceFilters({
  search,
  categoryFilter,
  onSearchChange,
  onCategoryFilterChange,
  filterOptions,
}: ServiceFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400" aria-hidden="true" />
        <input
          type="text"
          placeholder="Buscar servicio..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar servicio"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500"
        />
      </div>
      <div className="w-full sm:w-48 sm:flex-shrink-0">
        <Select
          value={categoryFilter}
          onChange={onCategoryFilterChange}
          options={filterOptions}
          placeholder="Categoría"
          className="py-3"
        />
      </div>
    </div>
  );
});
