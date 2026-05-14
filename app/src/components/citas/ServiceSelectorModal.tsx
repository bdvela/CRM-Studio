'use client';

import { useEffect, useMemo, useReducer, memo } from 'react';
import type { ServiceSelectorModalContentProps } from './types';
import { getAvailableArtistsForService } from './helpers';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Search, Check, Sparkles } from 'lucide-react';

type SelectorState = {
  selectedIds: string[];
  artists: Record<string, string>;
  prices: Record<string, number>;
  search: string;
  categoryFilter: string;
};

type SelectorAction =
  | { type: 'TOGGLE'; serviceId: string; artistId?: string; price?: number }
  | { type: 'SET_ARTIST'; serviceId: string; artistId: string }
  | { type: 'REMOVE_ARTIST'; serviceId: string }
  | { type: 'SET_PRICE'; serviceId: string; price: number }
  | { type: 'SET_SEARCH'; search: string }
  | { type: 'SET_CATEGORY_FILTER'; categoryFilter: string }
  | { type: 'RESET'; state: SelectorState };

function selectorReducer(state: SelectorState, action: SelectorAction): SelectorState {
  switch (action.type) {
    case 'TOGGLE': {
      if (state.selectedIds.includes(action.serviceId)) {
        const newIds = state.selectedIds.filter(id => id !== action.serviceId);
        const newArtists = { ...state.artists };
        delete newArtists[action.serviceId];
        const newPrices = { ...state.prices };
        delete newPrices[action.serviceId];
        return { ...state, selectedIds: newIds, artists: newArtists, prices: newPrices };
      }
      const newIds = [...state.selectedIds, action.serviceId];
      const newArtists = { ...state.artists };
      if (action.artistId) newArtists[action.serviceId] = action.artistId;
      const newPrices = { ...state.prices };
      if (action.price !== undefined) newPrices[action.serviceId] = action.price;
      return { ...state, selectedIds: newIds, artists: newArtists, prices: newPrices };
    }
    case 'SET_ARTIST': {
      return { ...state, artists: { ...state.artists, [action.serviceId]: action.artistId } };
    }
    case 'REMOVE_ARTIST': {
      const newArtists = { ...state.artists };
      delete newArtists[action.serviceId];
      return { ...state, artists: newArtists };
    }
    case 'SET_PRICE': {
      return { ...state, prices: { ...state.prices, [action.serviceId]: action.price } };
    }
    case 'SET_SEARCH': return { ...state, search: action.search };
    case 'SET_CATEGORY_FILTER': return { ...state, categoryFilter: action.categoryFilter };
    case 'RESET': return action.state;
    default: return state;
  }
}

const ServiceSelectorHeader = memo(function ServiceSelectorHeader({
  search,
  categoryFilter,
  categoriesForFilter,
  selectedCount,
  onSearchChange,
  onCategoryFilterChange,
}: {
  search: string;
  categoryFilter: string;
  categoriesForFilter: Array<{ id: string; name: string; icon: string; sort_order: number }>;
  selectedCount: number;
  onSearchChange: (search: string) => void;
  onCategoryFilterChange: (categoryFilter: string) => void;
}) {
  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar servicio..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onCategoryFilterChange('')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            !categoryFilter
              ? 'bg-salon-100 text-salon-700'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          )}
        >
          Todos
        </button>
        {categoriesForFilter.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryFilterChange(cat.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
              categoryFilter === cat.id
                ? 'bg-salon-100 text-salon-700'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            )}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-salon-600">
          <Check className="size-4" />
          <span className="font-medium">{selectedCount} servicio{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}</span>
        </div>
      )}
    </>
  );
});

export const ServiceSelectorModalContent = memo(function ServiceSelectorModalContent({
  open, services, staff,
  initialSelectedIds, initialArtists, initialPrices,
  onConfirm, onClose,
}: ServiceSelectorModalContentProps) {
  const initialState = useMemo<SelectorState>(() => ({
    selectedIds: initialSelectedIds,
    artists: initialArtists,
    prices: initialPrices,
    search: '',
    categoryFilter: '',
  }), [initialSelectedIds, initialArtists, initialPrices]);

  const [selectorState, dispatchSelector] = useReducer(selectorReducer, initialState);

  useEffect(() => {
    if (!open) return;
    dispatchSelector({ type: 'RESET', state: initialState });
  }, [open, initialState]);

  const activeServices = useMemo(() => services.filter(s => s.active), [services]);

  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  const categoriesForFilter = useMemo(() => {
    const byCategory: Record<string, { id: string; name: string; icon: string; sort_order: number }> = {};
    activeServices.forEach(s => {
      if (s.category_id && !byCategory[s.category_id]) {
        byCategory[s.category_id] = {
          id: s.category_id,
          name: s.category?.name || 'Otros',
          icon: s.category?.icon || '📋',
          sort_order: s.category?.sort_order ?? 999,
        };
      }
    });
    return Object.values(byCategory).sort((a, b) => a.sort_order - b.sort_order);
  }, [activeServices]);

  const filteredServices = useMemo(() => activeServices.filter(s => {
    if (selectorState.search) {
      const searchLower = selectorState.search.toLowerCase();
      const matchesSearch = s.name.toLowerCase().includes(searchLower);
      const matchesCategory = (s.category?.name || '').toLowerCase().includes(searchLower);
      if (!matchesSearch && !matchesCategory) return false;
    }
    if (selectorState.categoryFilter && s.category_id !== selectorState.categoryFilter) {
      return false;
    }
    return true;
  }), [activeServices, selectorState.search, selectorState.categoryFilter]);

  function handleToggleService(serviceId: string) {
    const svc = serviceById.get(serviceId);

    if (selectorState.selectedIds.includes(serviceId)) {
      dispatchSelector({ type: 'TOGGLE', serviceId });
    } else {
      let artistId: string | undefined;
      let price: number | undefined;
      if (svc && !selectorState.artists[serviceId]) {
        const artists = getAvailableArtistsForService(svc.id, svc.category_id, staff, services);
        if (artists.length === 1) artistId = artists[0].id;
      }
      if (svc && selectorState.prices[serviceId] === undefined) {
        price = svc.price_type === 'variable'
          ? (svc.price_from || 0)
          : (svc.price || 0);
      }
      dispatchSelector({ type: 'TOGGLE', serviceId, artistId, price });

      setTimeout(() => {
        const element = document.getElementById(`service-selector-${serviceId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }

  function handleConfirmSelection() {
    const newSelectedIds = [...selectorState.selectedIds];
    const newArtists: Record<string, string> = {};
    const newPrices: Record<string, number> = {};
    newSelectedIds.forEach(svcId => {
      if (selectorState.artists[svcId]) {
        newArtists[svcId] = selectorState.artists[svcId];
      }
      if (selectorState.prices[svcId] !== undefined && selectorState.prices[svcId] !== null) {
        newPrices[svcId] = selectorState.prices[svcId];
      }
    });
    onConfirm({ selectedIds: newSelectedIds, artists: newArtists, prices: newPrices });
  }

  return (
    <div className="space-y-4">
      <ServiceSelectorHeader
        search={selectorState.search}
        categoryFilter={selectorState.categoryFilter}
        categoriesForFilter={categoriesForFilter}
        selectedCount={selectorState.selectedIds.length}
        onSearchChange={(search) => dispatchSelector({ type: 'SET_SEARCH', search })}
        onCategoryFilterChange={(categoryFilter) => dispatchSelector({ type: 'SET_CATEGORY_FILTER', categoryFilter })}
      />

      <div className="space-y-1.5 max-h-64 sm:max-h-80 overflow-y-auto">
        {filteredServices.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 text-sm">
            No hay servicios que coincidan
          </div>
        ) : (
          filteredServices.map(svc => {
            const isSelected = selectorState.selectedIds.includes(svc.id);
            const isVariablePrice = svc.price_type === 'variable';
            const catIcon = svc.category?.icon || '📋';

            const availableArtists = getAvailableArtistsForService(svc.id, svc.category_id, staff, services);
            const suggestedArtistIds = availableArtists.map(a => a.id);
            const selectedArtistId = selectorState.artists[svc.id];
            const selectedArtist = staff.find(s => s.id === selectedArtistId);
            const isSelectedArtistSuggested = selectedArtistId && suggestedArtistIds.includes(selectedArtistId);

            const currentPrice = selectorState.prices[svc.id] ?? (isVariablePrice ? (svc.price_from || 0) : (svc.price || 0));

            let priceLabel = '';
            if (isVariablePrice) {
              if (svc.price_from && svc.price_to) {
                priceLabel = `S/${svc.price_from}-${svc.price_to}`;
              } else if (svc.price_from) {
                priceLabel = `S/${svc.price_from}+`;
              } else {
                priceLabel = 'Variable';
              }
            } else {
              priceLabel = `S/${svc.price}`;
            }

            const artistOptions = [
              { value: '', label: 'Sin artista' },
              ...availableArtists.map(s => ({ value: s.id, label: s.name })),
            ];

            return (
              <div
                key={svc.id}
                id={`service-selector-${svc.id}`}
                className={cn(
                  'rounded-xl transition-colors overflow-hidden',
                  isSelected ? 'bg-salon-50 border border-salon-200' : 'border border-transparent hover:bg-zinc-50'
                )}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleService(svc.id); }}
                  className="flex items-center gap-3 p-2.5 cursor-pointer"
                  onClick={() => handleToggleService(svc.id)}
                >
                  <div className={cn(
                    'size-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0',
                    isSelected
                      ? 'bg-salon-500 border-salon-500'
                      : 'border-zinc-300'
                  )}>
                    {isSelected && <Check className="size-3.5 text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{catIcon}</span>
                      <span className="text-sm font-medium text-zinc-900 truncate">{svc.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-zinc-400">{svc.duration_min} min</span>
                      <span className={cn(
                        'text-xs font-medium',
                        isVariablePrice ? 'text-amber-600' : 'text-zinc-500'
                      )}>
                        {priceLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="px-3 pb-3 pt-1 ml-8 space-y-3 border-t border-salon-100">
                    <div>
                      <Select
                        label="Artista"
                        value={selectedArtistId || ''}
                        onChange={(val) => {
                          if (val) {
                            dispatchSelector({ type: 'SET_ARTIST', serviceId: svc.id, artistId: val });
                          } else {
                            dispatchSelector({ type: 'REMOVE_ARTIST', serviceId: svc.id });
                          }
                        }}
                        options={artistOptions}
                        placeholder="Seleccionar artista..."
                      />
                      {isSelectedArtistSuggested && selectedArtist && (
                        <p className="text-xs text-salon-600 flex items-center gap-1 mt-1.5">
                          <Sparkles className="size-3" />
                          <span className="font-medium">{selectedArtist.name}</span> sugerida para este servicio
                        </p>
                      )}
                      {!selectedArtistId && suggestedArtistIds.length > 0 && (
                        <p className="text-xs text-zinc-400 mt-1.5">
                          {suggestedArtistIds.length} artista{suggestedArtistIds.length !== 1 ? 's' : ''} sugerido{suggestedArtistIds.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="sel-price" className="block text-sm font-medium text-zinc-700">
                        Precio
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                          <span className="text-zinc-400 text-sm font-medium select-none">S/</span>
                        </div>
                        <input
                          id="sel-price"
                          type="number"
                          step="0.01"
                          value={currentPrice}
                          onChange={(e) => {
                            dispatchSelector({ type: 'SET_PRICE', serviceId: svc.id, price: e.target.value ? parseFloat(e.target.value) : 0 });
                          }}
                          placeholder={isVariablePrice
                            ? (svc.price_from ? `Desde ${svc.price_from}` : '0')
                            : (svc.price ? `${svc.price}` : '0')
                          }
                          className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent placeholder:text-zinc-300"
                        />
                      </div>
                      {isVariablePrice && svc.price_from && (
                        <p className="text-xs text-amber-600 mt-1.5">
                          Rango sugerido: S/{svc.price_from} - {svc.price_to ? `S/${svc.price_to}` : 'Sin límite'}
                        </p>
                      )}
                      {!isVariablePrice && (
                        <p className="text-xs text-zinc-400 mt-1.5">
                          Precio estándar del servicio: {formatCurrency(svc.price)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 border-t border-zinc-100">
        <div className="hidden sm:block flex-1" />

        <div className="flex flex-1 sm:flex-none gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleConfirmSelection}
            disabled={selectorState.selectedIds.length === 0}
          >
            Agregar ({selectorState.selectedIds.length})
          </Button>
        </div>
      </div>
    </div>
  );
});
