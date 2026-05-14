'use client';

import type { ClientListContentProps } from './types';
import type { ClientStatus } from '@/types/database';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, STATUS_ORDER, PAGE_SIZE } from './constants';
import { ClientCard } from './ClientCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';
import { useMemo } from 'react';

function groupByStatus(clients: ClientListContentProps['clients']) {
  return clients.reduce((acc, c) => {
    const key = c.status;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {} as Record<string, ClientListContentProps['clients']>);
}

export function ClientListContent({
  loading,
  clients,
  statusFilter,
  search,
  onClientClick,
  onShowMore,
  visibleCount,
  totalVisible,
}: ClientListContentProps) {
  const grouped = useMemo(() => groupByStatus(clients), [clients]);
  const hasMore = totalVisible > visibleCount;

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Cargando clientas">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={`skel-${i}`} className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4 px-3 sm:px-4 rounded-2xl bg-zinc-100 animate-pulse">
            <div className="size-10 sm:size-12 rounded-full bg-zinc-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-zinc-200 rounded" />
              <div className="h-3 w-24 bg-zinc-200 rounded" />
            </div>
            <div className="hidden sm:block space-y-1">
              <div className="h-4 w-16 bg-zinc-200 rounded" />
              <div className="h-3 w-12 bg-zinc-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    const hasFilters = search || statusFilter !== 'all';
    return (
      <Card>
        <CardContent className="py-12 text-center text-zinc-400">
          <Users className="size-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{hasFilters ? 'No hay clientas que coincidan con los filtros' : 'No hay clientas registradas'}</p>
          {!hasFilters && (
            <Button size="sm" className="mt-4" onClick={() => document.getElementById('btn-nueva-clienta')?.click()}>
              <Plus className="size-4 mr-1" /> Registrar primera clienta
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (statusFilter === 'all') {
    return (
      <div className="space-y-6">
        {STATUS_ORDER.map((status) => {
          const items = grouped[status] || [];
          if (items.length === 0) return null;
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={STATUS_BADGE_VARIANT[status]} className="text-xs">{STATUS_LABELS[status as ClientStatus]}</Badge>
                <span className="text-xs text-zinc-400">{items.length} clienta{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {items.map((client) => (
                  <ClientCard key={client.id} client={client} onClick={() => onClientClick(client)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clients.slice(0, visibleCount).map((client) => (
        <ClientCard key={client.id} client={client} onClick={() => onClientClick(client)} />
      ))}
      {hasMore && (
        <button onClick={onShowMore} className="w-full py-3 text-sm text-salon-600 font-medium hover:text-salon-700 transition-colors text-center">
          Ver más ({totalVisible - visibleCount} restantes)
        </button>
      )}
    </div>
  );
}
