'use client';

import { memo, useCallback } from 'react';
import type { ClientFiltersProps, StatusFilter } from './types';
import { STATUS_OPTIONS } from './constants';
import { Select } from '@/components/ui/select';
import { Search } from 'lucide-react';

export const ClientFilters = memo(function ClientFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: ClientFiltersProps) {
  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value),
    [onSearchChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => onStatusFilterChange(value as StatusFilter),
    [onStatusFilterChange]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o Instagram..."
          value={search}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500"
          aria-label="Buscar clientas"
        />
      </div>
      <div className="w-full sm:w-48 flex-shrink-0">
        <Select
          value={statusFilter}
          onChange={handleStatusChange}
          options={STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
        />
      </div>
    </div>
  );
});
