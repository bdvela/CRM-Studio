'use client';

import { Palette, Plus, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServiceFilters } from './ServiceFilters';
import { ServiceCard } from './ServiceCard';
import type { ServiceListContentProps } from './types';

export function ServiceListContent({
  search, categoryFilter, onSearchChange, onCategoryFilterChange,
  filterOptions, loading, error, filtered, grouped, categories, onOpenNew, openEdit,
}: ServiceListContentProps) {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
      <ServiceFilters
        search={search}
        categoryFilter={categoryFilter}
        onSearchChange={onSearchChange}
        onCategoryFilterChange={onCategoryFilterChange}
        filterOptions={filterOptions}
      />

      <div className="flex items-center gap-4 text-sm text-zinc-500">
        <span>{filtered.length} servicios</span>
        {categoryFilter !== 'all' && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-salon-600 font-medium">
              Filtrado: {categories.find(c => c.id === categoryFilter)?.name || 'Categoría'}
            </span>
          </>
        )}
      </div>

      {loading ? (
        categoryFilter === 'all' ? (
          <div className="space-y-6" aria-label="Cargando servicios">
            {[
              { badge: 'bg-salon-200', cards: 3 },
              { badge: 'bg-amber-200', cards: 2 },
              { badge: 'bg-green-200', cards: 2 },
            ].map((group, gi) => (
              <div key={gi} className="space-y-3">
                <div className="flex items-center gap-2 animate-pulse">
                  <div className={`h-5 w-24 rounded-full ${group.badge}`} />
                  <div className="h-3 w-8 rounded bg-zinc-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: group.cards }).map((_, ci) => (
                    <div key={ci} className="h-28 rounded-2xl bg-zinc-200 animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Cargando servicios">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={`sk-${n}`} className="h-28 rounded-2xl bg-zinc-200 animate-pulse" />
            ))}
          </div>
        )
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3" role="alert">
          <AlertCircle className="size-10 mx-auto text-red-400" aria-hidden="true" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-400">
            <Palette className="size-12 mx-auto mb-3 opacity-30" aria-hidden="true" />
            <p className="text-sm">
              {search || categoryFilter !== 'all'
                ? 'No hay servicios que coincidan con los filtros'
                : 'No hay servicios registrados'
              }
            </p>
            {!search && categoryFilter === 'all' && (
              <Button size="sm" className="mt-4" onClick={onOpenNew}>
                <Plus className="size-4 mr-1" aria-hidden="true" /> Crear primer servicio
              </Button>
            )}
          </CardContent>
        </Card>
      ) : categoryFilter === 'all' ? (
        <div className="space-y-6" key={`${categoryFilter}-${search}`}>
          {Object.entries(grouped).map(([category, svcs]) => {
            const catColor = svcs[0]?.category?.color || '#6B7280';
            return (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Badge variant="custom" color={catColor}>{category}</Badge>
                  <span className="text-xs text-zinc-400">({svcs.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {svcs.map((svc, i) => <div key={svc.id} className="animate-fadeInUp" style={{ animationDelay: `${Math.min(i * 50, 300)}ms`, opacity: 0 }}><ServiceCard service={svc} onClick={openEdit} /></div>)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" key={`${categoryFilter}-${search}`}>
          {filtered.map((svc, i) => <div key={svc.id} className="animate-fadeInUp" style={{ animationDelay: `${Math.min(i * 50, 300)}ms`, opacity: 0 }}><ServiceCard service={svc} onClick={openEdit} /></div>)}
        </div>
      )}
    </div>
  );
}
