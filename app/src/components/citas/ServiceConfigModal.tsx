'use client';

import { useEffect, useMemo, useReducer, memo } from 'react';
import type { ServiceConfigModalContentProps } from './types';
import { getAvailableArtistsForService } from './helpers';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Clock, Sparkles, Trash2 } from 'lucide-react';

type ConfigState = { artistId: string; customPrice: number | null };
type ConfigAction =
  | { type: 'SET_ARTIST'; artistId: string }
  | { type: 'SET_PRICE'; price: number | null }
  | { type: 'RESET'; state: ConfigState };

function configReducer(state: ConfigState, action: ConfigAction): ConfigState {
  switch (action.type) {
    case 'SET_ARTIST': return { ...state, artistId: action.artistId };
    case 'SET_PRICE': return { ...state, customPrice: action.price };
    case 'RESET': return action.state;
    default: return state;
  }
}

export const ServiceConfigModalContent = memo(function ServiceConfigModalContent({
  open, serviceId, services, staff,
  currentArtistId, currentPrice,
  onSave, onRemove, onClose,
}: ServiceConfigModalContentProps) {
  const initialState = useMemo(() => ({ artistId: currentArtistId, customPrice: currentPrice }), [currentArtistId, currentPrice]);
  const [configState, dispatchConfig] = useReducer(configReducer, initialState);
  const svc = useMemo(() => services.find(s => s.id === serviceId), [services, serviceId]);
  const availableArtists = useMemo(
    () => serviceId ? getAvailableArtistsForService(serviceId, svc?.category_id, staff, services) : [],
    [serviceId, svc?.category_id, staff, services],
  );

  useEffect(() => {
    if (!open || !serviceId) return;
    dispatchConfig({ type: 'RESET', state: initialState });
  }, [open, serviceId, initialState]);

  if (!open || !serviceId || !svc) return null;

  const isVariablePrice = svc.price_type === 'variable';
  const suggestedArtistIds = availableArtists.map(a => a.id);
  const isSelectedArtistSuggested = configState.artistId && suggestedArtistIds.includes(configState.artistId);
  const defaultPrice = isVariablePrice ? (svc.price_from || 0) : (svc.price || 0);

  function handleSaveConfig() {
    if (!serviceId) return;
    onSave({ serviceId, artistId: configState.artistId, price: configState.customPrice });
  }

  function handleRemoveService() {
    if (!serviceId) return;
    onRemove(serviceId);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="config-artist" className="text-sm font-medium text-zinc-700">Artista</label>
        <Select
          id="config-artist"
          value={configState.artistId}
          onChange={(v) => dispatchConfig({ type: 'SET_ARTIST', artistId: v })}
          placeholder="Sin artista"
          options={[
            { value: '', label: 'Sin artista' },
            ...availableArtists.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        {isSelectedArtistSuggested && (
          <p className="text-xs text-salon-600 flex items-center gap-1">
            <Sparkles className="size-3" /> Sugerida para este servicio
          </p>
        )}
        {suggestedArtistIds.length > 1 && (
          <p className="text-xs text-zinc-400">
            {suggestedArtistIds.length} artistas sugeridos para este servicio
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="config-price" className="text-sm font-medium text-zinc-700">Precio</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-zinc-400 text-sm font-medium select-none">S/</span>
          </div>
          <input
            id="config-price"
            type="number"
            step="0.01"
            value={configState.customPrice ?? defaultPrice}
            onChange={(e) => {
              dispatchConfig({ type: 'SET_PRICE', price: e.target.value ? parseFloat(e.target.value) : 0 });
            }}
            onFocus={(e) => e.target.select()}
            placeholder={isVariablePrice
              ? (svc.price_from ? `Desde ${svc.price_from}` : '0')
              : (svc.price ? `${svc.price}` : '0')
            }
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent"
          />
        </div>
        {isVariablePrice && svc.price_from && (
          <p className="text-xs text-amber-600">
            Rango sugerido: S/{svc.price_from} - {svc.price_to ? `S/${svc.price_to}` : 'Sin límite'}
          </p>
        )}
        {!isVariablePrice && (
          <p className="text-xs text-zinc-400">
            Precio estándar del servicio: {formatCurrency(svc.price)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1 pb-2">
        <Clock className="size-4 text-zinc-400" />
        <span className="text-sm text-zinc-500">Duración: {svc.duration_min} min</span>
        <span className="text-xs text-zinc-400">(no modificable)</span>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 border-t border-zinc-100">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 order-last sm:order-none"
          onClick={handleRemoveService}
        >
          <Trash2 className="size-4 mr-1" /> Quitar servicio
        </Button>

        <div className="hidden sm:block flex-1" />

        <div className="flex flex-1 sm:flex-none gap-2 order-first sm:order-none">
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
            onClick={handleSaveConfig}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
});
