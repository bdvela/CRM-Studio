'use client';

import { Palette, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServiceFilters } from './ServiceFilters';
import { ServiceCard } from './ServiceCard';
import type { ServiceListContentProps } from './types';

export function ServiceListContent({
  search, categoryFilter, onSearchChange, onCategoryFilterChange,
  filterOptions, loading, filtered, grouped, categories, onOpenNew, openEdit,
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Cargando servicios">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={`sk-${n}`} className="h-28 rounded-2xl bg-zinc-200 animate-pulse" />
          ))}
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
                  {svcs.map((svc) => <ServiceCard key={svc.id} service={svc} onClick={openEdit} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" key={`${categoryFilter}-${search}`}>
          {filtered.map((svc) => <ServiceCard key={svc.id} service={svc} onClick={openEdit} />)}
        </div>
      )}
    </div>
  );
}
