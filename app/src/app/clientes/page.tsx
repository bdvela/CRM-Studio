'use client';

import { useEffect, useState } from 'react';
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

export default function ClientesPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form, setForm] = useState<ClientInsert>({
    name: '', phone: '', email: '', instagram: '', status: 'prospecto', notes: '', photo_url: null,
  });

  async function load() {
    try {
      const data = await getClients();
      setClients(data as unknown as Client[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    const normalizedPhone = normalizePeruPhone(form.phone);
    const formToSave = { ...form, phone: normalizedPhone };
    
    setSubmitting(true);
    try {
      await createClient(formToSave);
      toast.success('Clienta creada');
      setShowModal(false);
      setForm({ name: '', phone: '', email: '', instagram: '', status: 'prospecto', notes: '', photo_url: null });
      load();
    } catch (e) {
      toast.error('Error al crear');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredBySearch = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.instagram || '').toLowerCase().includes(search.toLowerCase())
  );

  const filtered = statusFilter === 'all'
    ? filteredBySearch
    : filteredBySearch.filter(c => c.status === statusFilter);

  const grouped = groupByStatus(filtered);

  return (
    <>
      <Header title="Clientes" action={
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nueva
        </Button>
      } />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
        {/* Buscador + Filtro */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o Instagram..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
            />
          </div>
          <div className="w-full sm:w-48 flex-shrink-0">
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            />
          </div>
        </div>

        {/* Client List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay clientas {search ? 'que coincidan' : 'registradas'}</p>
            </CardContent>
          </Card>
        ) : statusFilter === 'all' ? (
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
                    <span className="text-xs text-gray-400">
                      {items.length} clienta{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((client) => (
                      <ClientCard key={client.id} client={client} onClick={() => router.push(`/clientes/${client.id}`)} />
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
              <ClientCard key={client.id} client={client} onClick={() => router.push(`/clientes/${client.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Clienta">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" />
          <Input label="Teléfono" leftPrefix={<FlagPeru className="w-5 h-5" />} value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: formatPeruPhoneForInput(e.target.value) })} placeholder="987 654 321" maxLength={11} />
          <Input label="Email" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@ejemplo.com" />
          <Input label="Instagram" value={form.instagram || ''} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" />
           <Select label="Estado" value={form.status} onChange={(value) => setForm({ ...form, status: value as ClientInsert['status'] })} options={[
             { value: 'prospecto', label: 'Prospecto' },
             { value: 'activa', label: 'Activa' },
             { value: 'inactiva', label: 'Inactiva' },
             { value: 'vip', label: 'VIP' },
           ]} />
          <Textarea label="Notas" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Preferencias, alergias, etc." />
           <div className="flex gap-3 pt-2">
             <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
             <Button type="submit" className="flex-1" loading={submitting}>
               {submitting ? 'Guardando...' : 'Crear'}
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
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 py-4">
        <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-bold flex-shrink-0">
          {client.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{client.name}</p>
            <Badge variant={statusBadge[client.status] || 'default'}>
              {statusLabels[client.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
            {client.phone && (
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>
            )}
            {client.instagram && (
              <span className="flex items-center gap-1"><Instagram className="w-3 h-3" />{client.instagram}</span>
            )}
          </div>
        </div>
        <div className="text-right hidden sm:block">
          {client.client_stats && (
            <>
              <p className="text-sm font-semibold">{formatCurrency(client.client_stats.total_spent)}</p>
              <p className="text-xs text-gray-400">{client.client_stats.total_appointments} citas</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
