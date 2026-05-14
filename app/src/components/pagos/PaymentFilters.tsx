'use client';

import { memo } from 'react';
import type { PaymentFiltersProps } from './types';
import { cn } from '@/lib/utils';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'ingreso', label: 'Ingresos' },
  { value: 'egreso', label: 'Egresos' },
];

export const PaymentFilters = memo(function PaymentFilters({
  search,
  filterType,
  onSearchChange,
  onFilterTypeChange,
  onNewClick,
}: PaymentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="relative flex-1 w-full">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Buscar por concepto..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar pagos"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500"
        />
      </div>
      <div
        className="flex gap-1 p-1 bg-zinc-100 rounded-xl"
        role="radiogroup"
        aria-label="Filtrar por tipo"
      >
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilterTypeChange(opt.value)}
            role="radio"
            aria-checked={filterType === opt.value}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all',
              filterType === opt.value
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <Button size="sm" onClick={onNewClick}>
        <Plus className="size-4 mr-1" /> Registrar
      </Button>
    </div>
  );
});
