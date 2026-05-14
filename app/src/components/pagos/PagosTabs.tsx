'use client';

import { memo } from 'react';
import type { PagosTabsProps, TabId } from './types';
import { cn } from '@/lib/utils';
import { DollarSign, Clock, PiggyBank, TrendingUp } from 'lucide-react';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'registrar', label: 'Registrar', icon: <DollarSign className="size-4" /> },
  { id: 'pendientes', label: 'Pendientes', icon: <Clock className="size-4" /> },
  { id: 'resumen', label: 'Resumen', icon: <PiggyBank className="size-4" /> },
  { id: 'comisiones', label: 'Comisiones', icon: <TrendingUp className="size-4" /> },
];

export const PagosTabs = memo(function PagosTabs({ activeTab, onTabChange }: PagosTabsProps) {
  return (
    <div
      className="flex gap-1 p-1 bg-zinc-100 rounded-xl overflow-x-auto"
      role="tablist"
      aria-label="Secciones de pagos"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
            activeTab === tab.id
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
});
