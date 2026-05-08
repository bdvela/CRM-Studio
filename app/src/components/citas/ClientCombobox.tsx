'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getClients, createClient } from '@/lib/db/queries';
import { cn, normalizePeruPhone } from '@/lib/utils';
import { Search, Plus, Check, X, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ClientComboboxProps {
  value: string;
  onChange: (id: string) => void;
}

interface Client {
  id: string;
  name: string;
  phone?: string | null;
  instagram?: string | null;
  email?: string | null;
  status: string;
}

export function ClientCombobox({ value, onChange }: ClientComboboxProps) {
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formInstagram, setFormInstagram] = useState('');

  useEffect(() => {
    getClients().then(data => {
      setAllClients(data as Client[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = search.length === 0
    ? allClients.slice(0, 8)
    : allClients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search) ||
        (c.instagram || '').toLowerCase().includes(search.toLowerCase())
      );

  const hasExactMatch = allClients.some(c =>
    c.name.toLowerCase() === search.toLowerCase()
  );

  const showCreateOption = search.length > 0 && !hasExactMatch;

  const selectedClient = allClients.find(c => c.id === value);

  function handleSelect(client: Client) {
    onChange(client.id);
    setSearch('');
    setIsOpen(false);
    setShowForm(false);
  }

  function handleCreateNew() {
    if (search.trim().length === 0) return;
    setFormName(search.trim());
    setShowForm(true);
    setIsOpen(false);
  }

  async function handleCreateClient() {
    if (!formName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setIsCreating(true);
    try {
       const newClient = await createClient({
        name: formName.trim(),
        phone: normalizePeruPhone(formPhone),
        email: formEmail.trim() || null,
        instagram: formInstagram.trim() || null,
        status: 'prospecto',
        notes: '',
      });
      
      // Refresh client list
      const updated = await getClients();
      setAllClients(updated as Client[]);
      
      // Auto-select
      onChange(newClient.id);
      
      // Show "nueva" badge
      setJustCreated(true);
      setTimeout(() => setJustCreated(false), 4000);
      
      setShowForm(false);
      setSearch('');
      setFormName('');
      setFormPhone('');
      setFormEmail('');
      setFormInstagram('');
      toast.success('Clienta creada');
    } catch (e) {
      toast.error('Error al crear la clienta');
    } finally {
      setIsCreating(false);
    }
  }

  function handleCancelForm() {
    setShowForm(false);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormInstagram('');
  }

  function handleClearSelection() {
    onChange('');
    setSearch('');
    setJustCreated(false);
  }

  // Selected state with "nueva" badge
  if (selectedClient && !showForm) {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Clienta</label>
        <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-salon-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {selectedClient.name[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium flex-1 truncate">{selectedClient.name}</span>
          {justCreated && (
            <span className="flex items-center gap-1 text-xs font-medium text-salon-600 bg-salon-50 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" /> nueva
            </span>
          )}
          <button
            type="button"
            onClick={handleClearSelection}
            className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <label className="block text-sm font-medium text-gray-700">Clienta</label>

      {/* Inline create form */}
      {showForm ? (
        <div className="rounded-xl border border-salon-200 bg-salon-50 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-salon-700">Nueva clienta</span>
            <button type="button" onClick={handleCancelForm} className="p-1 rounded-lg hover:bg-salon-100 transition-colors">
              <X className="w-4 h-4 text-salon-500" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Nombre *"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-salon-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
          />
          <input
            type="tel"
            placeholder="Teléfono (opcional)"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-salon-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="email"
              placeholder="Email (opcional)"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-salon-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
            />
            <input
              type="text"
              placeholder="Instagram (opcional)"
              value={formInstagram}
              onChange={(e) => setFormInstagram(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-salon-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancelForm}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-salon-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateClient}
              disabled={isCreating}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-salon-600 hover:bg-salon-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Crear y continuar
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar o nueva clienta..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
                if (!showForm) setShowForm(false);
              }}
              onFocus={() => setIsOpen(true)}
              onClick={() => setIsOpen(true)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
            />
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-3 text-center text-sm text-gray-400">Cargando...</div>
                ) : filtered.length === 0 && !showCreateOption ? (
                  <div className="px-4 py-3 text-center text-sm text-gray-400">Sin resultados</div>
                ) : (
                  <>
                    {filtered.map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelect(client)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-salon-100 flex items-center justify-center text-salon-600 text-xs font-bold flex-shrink-0">
                          {client.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{client.name}</p>
                          {client.phone && (
                            <p className="text-xs text-gray-400 truncate">{client.phone}</p>
                          )}
                        </div>
                      </button>
                    ))}
                    {showCreateOption && (
                      <div className="border-t border-gray-100">
                        <button
                          type="button"
                          onClick={handleCreateNew}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-salon-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-salon-50 flex items-center justify-center flex-shrink-0">
                            <Plus className="w-4 h-4 text-salon-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-salon-600 truncate">
                              Crear nueva: <span className="font-normal">{search}</span>
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
