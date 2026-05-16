'use client';

import { useState, useReducer, useEffect, useRef, useMemo } from 'react';
import { getClients, createClient } from '@/lib/db/queries';
import type { Client } from '@/types/database';
import { cn, normalizePeruPhone } from '@/lib/utils';
import { Search, Plus, X, Sparkles, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ClientComboboxProps {
  value: string;
  onChange: (id: string) => void;
  initialClients?: Client[];
}

type ComboboxState = {
  search: string;
  isOpen: boolean;
  showForm: boolean;
  name: string;
  phone: string;
  email: string;
  instagram: string;
  allClients: Client[];
  isCreating: boolean;
  justCreated: boolean;
  loading: boolean;
};

type ComboboxAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'SET_FORM'; payload: boolean }
  | { type: 'SET_FIELD'; payload: { field: 'name' | 'phone' | 'email' | 'instagram'; value: string } }
  | { type: 'RESET_FORM' }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'SET_CREATING'; payload: boolean }
  | { type: 'SET_JUST_CREATED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: ComboboxState = {
  search: '',
  isOpen: false,
  showForm: false,
  name: '',
  phone: '',
  email: '',
  instagram: '',
  allClients: [],
  isCreating: false,
  justCreated: false,
  loading: true,
};

function comboboxReducer(state: ComboboxState, action: ComboboxAction): ComboboxState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_OPEN':
      return { ...state, isOpen: action.payload };
    case 'SET_FORM':
      return { ...state, showForm: action.payload };
    case 'SET_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'RESET_FORM':
      return { ...state, name: '', phone: '', email: '', instagram: '', showForm: false };
    case 'SET_CLIENTS':
      return { ...state, allClients: action.payload };
    case 'SET_CREATING':
      return { ...state, isCreating: action.payload };
    case 'SET_JUST_CREATED':
      return { ...state, justCreated: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// ---- Subcomponents ----

function LastVisitDate({ date }: { date: string }) {
  const display = useMemo(
    () => new Date(date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }),
    [date]
  );
  if (!display) return null;
  return <>{`Últ. visita: ${display}`}</>;
}

function SelectedClientView({ client, justCreated, onClear }: {
  client: Client;
  justCreated: boolean;
  onClear: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-zinc-700">Clienta</span>
      <div className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 bg-zinc-50">
        <div className="size-8 rounded-full bg-gradient-to-br from-salon-500/90 via-salon-400/50 to-salon-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm shadow-salon-500/20">
          {client.name[0].toUpperCase()}
        </div>
        <span className="text-sm font-medium flex-1 truncate">{client.name}</span>
        {justCreated && (
          <span className="flex items-center gap-1 text-xs font-medium text-salon-600 bg-salon-50 px-2 py-0.5 rounded-full">
            <Sparkles className="size-3" /> nueva
          </span>
        )}
        <button
          type="button"
          onClick={onClear}
          className="p-1 rounded-lg hover:bg-zinc-200 transition-colors"
        >
          <X className="size-4 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}

function ClientItem({ client, isHighlighted, onSelect, onHover }: {
  client: Client;
  isHighlighted: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
        isHighlighted ? 'bg-salon-50' : 'hover:bg-zinc-50'
      )}
    >
      <div className="size-7 rounded-full bg-salon-100 flex items-center justify-center text-salon-600 text-xs font-bold flex-shrink-0">
        {client.name[0].toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{client.name}</p>
        <p className="text-xs text-zinc-400 truncate">
          {client.client_stats?.last_visit
            ? <LastVisitDate date={client.client_stats.last_visit} />
            : client.phone || 'Sin actividad'}
        </p>
      </div>
      {client.client_stats && client.client_stats.total_appointments > 0 && (
        <span className="text-xs text-zinc-400 flex-shrink-0">{client.client_stats.total_appointments} citas</span>
      )}
    </button>
  );
}

function CreateClientForm({ state, dispatch, isCreating, onCreate, onCancel }: {
  state: ComboboxState;
  dispatch: React.Dispatch<ComboboxAction>;
  isCreating: boolean;
  onCreate: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-700">Nueva clienta</span>
        <button type="button" onClick={onCancel} className="p-1 rounded-lg hover:bg-zinc-200 transition-colors">
          <X className="size-4 text-zinc-500" />
        </button>
      </div>
      <Input
        label="Nombre *"
        value={state.name}
        onChange={(value) => dispatch({ type: 'SET_FIELD', payload: { field: 'name', value } })}
        placeholder="Ej: Ana López"
        minLength={2}
        maxLength={100}
      />
      <Input
        label="Teléfono (opcional)"
        type="tel"
        value={state.phone}
        onChange={(value) => dispatch({ type: 'SET_FIELD', payload: { field: 'phone', value } })}
        placeholder="987 654 321"
        numeric
        maxLength={11}
        minLength={9}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          label="Email (opcional)"
          type="email"
          value={state.email}
          onChange={(value) => dispatch({ type: 'SET_FIELD', payload: { field: 'email', value } })}
          placeholder="ana@email.com"
          maxLength={100}
        />
        <Input
          label="Instagram (opcional)"
          value={state.instagram}
          onChange={(value) => dispatch({ type: 'SET_FIELD', payload: { field: 'instagram', value } })}
          placeholder="@analopez"
          maxLength={50}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" className="flex-1" onClick={onCreate} loading={isCreating}>
          {isCreating ? 'Creando...' : 'Crear y continuar'}
        </Button>
      </div>
    </div>
  );
}

const RECENT_LIMIT = 20;

// ---- Main component ----

export function ClientCombobox({ value, onChange, initialClients }: ClientComboboxProps) {
  const [state, dispatch] = useReducer(
    comboboxReducer,
    initialClients
      ? { ...initialState, allClients: initialClients, loading: false }
      : initialState,
  );
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const justCreatedRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialClients) return;
    getClients().then(data => {
      dispatch({ type: 'SET_CLIENTS', payload: data as Client[] });
      dispatch({ type: 'SET_LOADING', payload: false });
    });
  }, [initialClients]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        dispatch({ type: 'SET_OPEN', payload: false });
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => { if (justCreatedRef.current) clearTimeout(justCreatedRef.current); };
  }, []);

  const recentClients = useMemo(() => [...state.allClients]
    .sort((a, b) => {
      const aDate = a.client_stats?.last_visit;
      const bDate = b.client_stats?.last_visit;
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, RECENT_LIMIT), [state.allClients]);

  const searchLower = state.search.toLowerCase();

  const filtered = useMemo(() => (
    state.search.length === 0
      ? recentClients
      : state.allClients.filter(c =>
          c.name.toLowerCase().includes(searchLower) ||
          (c.phone || '').includes(state.search) ||
          (c.instagram || '').toLowerCase().includes(searchLower)
        )
  ), [state.search, state.allClients, recentClients, searchLower]);

  const hasExactMatch = useMemo(() => state.allClients.some(c =>
    c.name.toLowerCase() === searchLower
  ), [state.allClients, searchLower]);

  const showCreateOption = state.search.length > 0 && !hasExactMatch;

  const selectedClient = useMemo(() => state.allClients.find(c => c.id === value), [state.allClients, value]);

  function handleSelect(client: Client) {
    onChange(client.id);
    dispatch({ type: 'SET_SEARCH', payload: '' });
    dispatch({ type: 'SET_OPEN', payload: false });
    dispatch({ type: 'SET_FORM', payload: false });
    setHighlightedIndex(-1);
  }

  function handleCreateNew() {
    if (state.search.trim().length === 0) return;
    dispatch({ type: 'SET_FIELD', payload: { field: 'name', value: state.search.trim() } });
    dispatch({ type: 'SET_FORM', payload: true });
    dispatch({ type: 'SET_OPEN', payload: false });
    setHighlightedIndex(-1);
  }

  async function handleCreateClient() {
    if (!state.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    dispatch({ type: 'SET_CREATING', payload: true });
    try {
      const newClient = await createClient({
        name: state.name.trim(),
        phone: normalizePeruPhone(state.phone),
        email: state.email.trim() || null,
        instagram: state.instagram.trim() || null,
        status: 'prospecto',
        notes: '',
      });

      dispatch({ type: 'SET_CLIENTS', payload: [newClient as Client, ...state.allClients] });

      onChange(newClient.id);

      if (justCreatedRef.current) clearTimeout(justCreatedRef.current);
      dispatch({ type: 'SET_JUST_CREATED', payload: true });
      justCreatedRef.current = setTimeout(() => {
        dispatch({ type: 'SET_JUST_CREATED', payload: false });
      }, 4000);

      dispatch({ type: 'RESET_FORM' });
      dispatch({ type: 'SET_SEARCH', payload: '' });
      toast.success('Clienta creada');
    } catch {
      toast.error('Error al crear la clienta');
    } finally {
      dispatch({ type: 'SET_CREATING', payload: false });
    }
  }

  function handleClearSelection() {
    onChange('');
    dispatch({ type: 'SET_SEARCH', payload: '' });
    if (justCreatedRef.current) clearTimeout(justCreatedRef.current);
    dispatch({ type: 'SET_JUST_CREATED', payload: false });
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!state.isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        dispatch({ type: 'SET_OPEN', payload: true });
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setHighlightedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          handleSelect(filtered[highlightedIndex]);
        } else if (showCreateOption) {
          handleCreateNew();
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        dispatch({ type: 'SET_OPEN', payload: false });
        setHighlightedIndex(-1);
        break;
      }
    }
  }

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLButtonElement>('[data-index]');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  if (selectedClient && !state.showForm) {
    return (
      <SelectedClientView
        client={selectedClient}
        justCreated={state.justCreated}
        onClear={handleClearSelection}
      />
    );
  }

  const resultCount = filtered.length;

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <label htmlFor="client-search" className="block text-sm font-medium text-zinc-700">Clienta</label>

      {state.showForm ? (
        <CreateClientForm
          state={state}
          dispatch={dispatch}
          isCreating={state.isCreating}
          onCreate={handleCreateClient}
          onCancel={() => dispatch({ type: 'RESET_FORM' })}
        />
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              ref={inputRef}
              id="client-search"
              type="text"
              placeholder="Buscar clienta..."
              value={state.search}
              onChange={(e) => {
                dispatch({ type: 'SET_SEARCH', payload: e.target.value });
                dispatch({ type: 'SET_OPEN', payload: true });
                if (!state.showForm) dispatch({ type: 'SET_FORM', payload: false });
                setHighlightedIndex(-1);
              }}
              onFocus={() => dispatch({ type: 'SET_OPEN', payload: true })}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500"
            />
          </div>

          {state.isOpen && (
            <div className="absolute z-50 w-full mt-1 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
              <div ref={listRef} className="max-h-60 overflow-y-auto">
                {state.loading ? (
                  <div className="px-4 py-3 text-center text-sm text-zinc-400">Cargando…</div>
                ) : filtered.length === 0 && !showCreateOption ? (
                  <div className="px-4 py-3 text-center text-sm text-zinc-400">Sin resultados</div>
                ) : (
                  <>
                    {state.search.length === 0 && (
                      <div className="px-4 pt-2 pb-1 text-xs font-medium text-zinc-400 flex items-center gap-1">
                        <Clock className="size-3" /> Últimas visitadas
                        <span className="ml-auto text-zinc-300">{Math.min(resultCount, RECENT_LIMIT)}{resultCount > RECENT_LIMIT ? '+' : ''}</span>
                      </div>
                    )}
                    {filtered.map((client, i) => (
                      <ClientItem
                        key={client.id}
                        client={client}
                        isHighlighted={highlightedIndex === i}
                        onSelect={() => handleSelect(client)}
                        onHover={() => setHighlightedIndex(i)}
                      />
                    ))}
                    {showCreateOption && (
                      <div className="border-t border-zinc-100">
                        <button
                          type="button"
                          onClick={handleCreateNew}
                          onMouseEnter={() => setHighlightedIndex(filtered.length)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                            highlightedIndex === filtered.length ? 'bg-salon-50' : 'hover:bg-salon-50'
                          )}
                        >
                          <div className="size-7 rounded-full bg-salon-50 flex items-center justify-center flex-shrink-0">
                            <Plus className="size-4 text-salon-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-salon-600 truncate">
                              Crear nueva: <span className="font-normal">{state.search}</span>
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              {filtered.length > 0 && (
                <div className="px-3 py-1.5 border-t border-zinc-100 text-xs text-zinc-400 flex items-center gap-3">
                  <span>↑↓ Navegar</span>
                  <span>↵ Seleccionar</span>
                  <span>Esc Cerrar</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
