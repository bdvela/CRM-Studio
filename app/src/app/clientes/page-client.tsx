'use client';

import { useEffect, useState, useReducer, useRef } from 'react';
import { getClients, createClient, updateClient, deleteClient } from '@/lib/db/queries';
import type { Client, ClientInsert, ClientStatus } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { FlagPeru } from '@/components/ui/FlagPeru';
import { formatCurrency, normalizePeruPhone, formatPeruPhoneForInput } from '@/lib/utils';
import { Users, Plus, Search, Phone, Instagram } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useConfirm } from '@/context/confirm-context';

const FORM_INIT: ClientInsert = {
  name: '', phone: '', email: '', instagram: '', status: 'prospecto', notes: '', photo_url: null,
};

function formReducer(state: ClientInsert, action: Partial<ClientInsert>) {
  return { ...state, ...action };
}

const statusBadge: Record<string, 'success' | 'warning' | 'danger' | 'purple'> = {
  prospecto: 'warning',
  activa: 'success',
  inactiva: 'danger',
  vip: 'purple',
};

const statusLabels: Record<string, string> = {
  prospecto: 'Prospecto',
  activa: 'Activa',
  inactiva: 'Inactiva',
  vip: 'VIP',
};

const STATUS_OPTIONS = [
  { value: 'all' as const, label: 'Todos' },
  { value: 'prospecto' as const, label: 'Prospecto' },
  { value: 'activa' as const, label: 'Activa' },
  { value: 'inactiva' as const, label: 'Inactiva' },
  { value: 'vip' as const, label: 'VIP' },
];

function getStatusGroup(clients: Client[], status: ClientStatus | 'all'): Client[] {
  if (status === 'all') return clients;
  return clients.filter(c => c.status === status);
}

function groupByStatus(clients: Client[]): Record<string, Client[]> {
  return clients.reduce((acc, c) => {
    const key = c.status;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {} as Record<string, Client[]>);
}

const STATUS_ORDER: ClientStatus[] = ['activa', 'vip', 'prospecto', 'inactiva'];

interface ClientesUIState {
  loading: boolean;
  submitting: boolean;
  showModal: boolean;
  search: string;
  statusFilter: string;
}

const CLIENTS_UI_INIT: ClientesUIState = {
  loading: true,
  submitting: false,
  showModal: false,
  search: '',
  statusFilter: 'all',
};

function clientesUIReducer(state: ClientesUIState, action: Partial<ClientesUIState>): ClientesUIState {
  return { ...state, ...action };
}

export default function ClientesPage({ initialClients }: { initialClients?: Client[] }) {
  const { push } = useRouter();
  const { confirm } = useConfirm();
  const [clients, setClients] = useState<Client[]>(initialClients || []);
  const [ui, dispatchUI] = useReducer(clientesUIReducer, { ...CLIENTS_UI_INIT, loading: !initialClients });
  const [form, dispatchForm] = useReducer(formReducer, FORM_INIT);
  const skipInitialLoad = useRef(!!initialClients);

  async function load() {
    try {
      const data = await getClients();
      setClients(data as unknown as Client[]);
    } catch (e) {
      console.error(e);
    } finally {
      dispatchUI({ loading: false });
    }
  }

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      return;
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ui.submitting) return;
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    const normalizedPhone = normalizePeruPhone(form.phone);
    const formToSave = { ...form, phone: normalizedPhone };
    
    dispatchUI({ submitting: true });
    try {
      await createClient(formToSave);
      toast.success('Clienta creada');
      dispatchUI({ showModal: false });
      dispatchForm(FORM_INIT);
      load();
    } catch (e) {
      toast.error('Error al crear');
    } finally {
      dispatchUI({ submitting: false });
    }
  }

  const filteredBySearch = clients.filter((c) =>
    c.name.toLowerCase().includes(ui.search.toLowerCase()) ||
    (c.phone || '').includes(ui.search) ||
    (c.instagram || '').toLowerCase().includes(ui.search.toLowerCase())
  );

  const filtered = ui.statusFilter === 'all'
    ? filteredBySearch
    : filteredBySearch.filter(c => c.status === ui.statusFilter);

  const grouped = groupByStatus(filtered);

  return (
    <>
      <Header title="Clientes" action={
        <Button size="sm" onClick={() => dispatchUI({ showModal: true })}>
          <Plus className="size-4 mr-1" /> Nueva
        </Button>
      } />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
        {/* Buscador + Filtro */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o Instagram..."
              value={ui.search}
              onChange={(e) => dispatchUI({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
            />
          </div>
          <div className="w-full sm:w-48 flex-shrink-0">
            <Select
              value={ui.statusFilter}
              onChange={(value) => dispatchUI({ statusFilter: value })}
              options={STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            />
          </div>
        </div>

        {/* Client List */}
        {ui.loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={'skel-' + i} className="h-16 rounded-2xl bg-zinc-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-zinc-400">
              <Users className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay clientas {ui.search ? 'que coincidan' : 'registradas'}</p>
            </CardContent>
          </Card>
        ) : ui.statusFilter === 'all' ? (
          /* Vista Todos: agrupado por estado */
          <div className="space-y-6">
            {STATUS_ORDER.map((status) => {
              const items = grouped[status] || [];
              if (items.length === 0) return null;
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={statusBadge[status]} className="text-xs">
                      {statusLabels[status]}
                    </Badge>
                    <span className="text-xs text-zinc-400">
                      {items.length} clienta{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((client) => (
                      <ClientCard key={client.id} client={client} onClick={() => push(`/clientes/${client.id}`)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Vista filtrada: sin agrupación */
          <div className="space-y-2">
            {filtered.map((client) => (
              <ClientCard key={client.id} client={client} onClick={() => push(`/clientes/${client.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={ui.showModal} onClose={() => dispatchUI({ showModal: false })} title="Nueva Clienta">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={(value) => dispatchForm({ name: value })} placeholder="Nombre completo" minLength={2} maxLength={100} />
          <Input label="Teléfono" leftPrefix={<FlagPeru className="size-5" />} value={form.phone || ''} onChange={(value) => dispatchForm({ phone: formatPeruPhoneForInput(value) })} placeholder="987 654 321" maxLength={11} />
          <Input label="Email" type="email" value={form.email || ''} onChange={(value) => dispatchForm({ email: value })} placeholder="email@ejemplo.com" maxLength={100} />
          <Input label="Instagram" value={form.instagram || ''} onChange={(value) => dispatchForm({ instagram: value })} placeholder="@usuario" maxLength={50} />
           <Select label="Estado" value={form.status} onChange={(value) => dispatchForm({ status: value as ClientInsert['status'] })} options={[
             { value: 'prospecto', label: 'Prospecto' },
             { value: 'activa', label: 'Activa' },
             { value: 'inactiva', label: 'Inactiva' },
             { value: 'vip', label: 'VIP' },
           ]} />
          <Textarea label="Notas" value={form.notes || ''} onChange={(value) => dispatchForm({ notes: value })} placeholder="Preferencias, alergias, etc." maxLength={500} />
           <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => dispatchUI({ showModal: false })}>Cancelar</Button>
              <Button type="submit" className="flex-1" loading={ui.submitting}>
                {ui.submitting ? 'Guardando...' : 'Crear'}
             </Button>
           </div>
        </form>
      </Modal>
    </>
  );
}

function ClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all w-full box-border"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4 px-3 sm:px-4">
        <div className="size-10 sm:size-12 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-bold flex-shrink-0">
          {client.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium truncate max-w-[150px] sm:max-w-none">{client.name}</p>
            <Badge variant={statusBadge[client.status] || 'default'} className="flex-shrink-0">
              {statusLabels[client.status]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1">
            {client.phone && (
              <span className="flex items-center gap-1 break-all"><Phone className="size-3 flex-shrink-0" />{client.phone}</span>
            )}
            {client.instagram && (
              <span className="flex items-center gap-1 break-all overflow-wrap:anywhere"><Instagram className="size-3 flex-shrink-0" />{client.instagram}</span>
            )}
          </div>
        </div>
        <div className="text-right hidden sm:block flex-shrink-0">
          {client.client_stats && (
            <>
              <p className="text-sm font-semibold">{formatCurrency(client.client_stats.total_spent)}</p>
              <p className="text-xs text-zinc-400">{client.client_stats.total_appointments} citas</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
