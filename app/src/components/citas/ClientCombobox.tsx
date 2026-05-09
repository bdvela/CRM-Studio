'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getClients, createClient } from '@/lib/db/queries';
import { cn, normalizePeruPhone } from '@/lib/utils';
import { Search, Plus, Check, X, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
      
      const updated = await getClients();
      setAllClients(updated as Client[]);
      
      onChange(newClient.id);
      
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

      {showForm ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Nueva clienta</span>
            <button 
              type="button" 
              onClick={handleCancelForm} 
              className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <Input
            label="Nombre *"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Ej: Ana López"
          />
          
          <Input
            label="Teléfono (opcional)"
            type="tel"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder="987 654 321"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              label="Email (opcional)"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="ana@email.com"
            />
            <Input
              label="Instagram (opcional)"
              value={formInstagram}
              onChange={(e) => setFormInstagram(e.target.value)}
              placeholder="@analopez"
            />
          </div>
          
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCancelForm}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleCreateClient}
              loading={isCreating}
            >
              {isCreating ? 'Creando...' : 'Crear y continuar'}
            </Button>
          </div>
        </div>
      ) : (
        <>
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
