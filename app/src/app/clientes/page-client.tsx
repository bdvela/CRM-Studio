'use client';

import { useEffect, useReducer, useRef, useMemo, useCallback } from 'react';
import { getClients, createClient, updateClient, deleteClient, getClientById, getAppointments } from '@/lib/db/queries';
import type { Client, ClientInsert } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/context/confirm-context';
import { normalizePeruPhone } from '@/lib/utils';
import { PAGE_SIZE } from '@/components/clientes/constants';
import type { ClientesUIState, ClientesUIAction, StatusFilter, ClientWithStats } from '@/components/clientes/types';
import { ClientFilters } from '@/components/clientes/ClientFilters';
import { ClientListContent } from '@/components/clientes/ClientListContent';
import { ClientFormModal } from '@/components/clientes/ClientFormModal';
import { ClientDetailModal } from '@/components/clientes/ClientDetailModal';

const UI_INIT: ClientesUIState = {
  clients: [],
  loading: false,
  submitting: false,
  showCreateModal: false,
  showDetailModal: false,
  viewingClient: null,
  editingClient: null,
  clientAppointments: [],
  search: '',
  statusFilter: 'all',
  saving: false,
  deleting: false,
  visibleCount: PAGE_SIZE,
};

function uiReducer(state: ClientesUIState, action: ClientesUIAction): ClientesUIState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.loading };
    case 'SET_CLIENTS': return { ...state, loading: false, clients: action.clients };
    case 'SET_SUBMITTING': return { ...state, submitting: action.submitting };
    case 'SET_SHOW_CREATE_MODAL': return { ...state, showCreateModal: action.show };
    case 'SET_SHOW_DETAIL_MODAL': return { ...state, showDetailModal: action.show };
    case 'SET_VIEWING_CLIENT': return { ...state, viewingClient: action.client, clientAppointments: action.appointments || state.clientAppointments, showDetailModal: true, activeModalTab: 'info' as const };
    case 'SET_EDITING_CLIENT': return { ...state, editingClient: action.client };
    case 'SET_SEARCH': return { ...state, search: action.search, visibleCount: PAGE_SIZE };
    case 'SET_STATUS_FILTER': return { ...state, statusFilter: action.status, visibleCount: PAGE_SIZE };
    case 'SET_SAVING': return { ...state, saving: action.saving };
    case 'SET_DELETING': return { ...state, deleting: action.deleting };
    case 'CLOSE_DETAIL': return { ...state, showDetailModal: false, viewingClient: null, editingClient: null, clientAppointments: [] };
    case 'SET_VISIBLE_COUNT': return { ...state, visibleCount: action.count };
    case 'RESET': return { ...UI_INIT, loading: true };
    default: return state;
  }
}

export default function ClientesPage({ initialClients }: { initialClients?: Client[] }) {
  const { confirm } = useConfirm();
  const [ui, dispatch] = useReducer(uiReducer, { ...UI_INIT, clients: initialClients || [] as ClientWithStats[], loading: !initialClients });
  const loaded = useRef(!!initialClients);

  async function load() {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const data = await getClients();
      dispatch({ type: 'SET_CLIENTS', clients: data as ClientWithStats[] });
    } catch {
      toast.error('Error al cargar clientas');
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }

  useEffect(() => {
    if (loaded.current) { loaded.current = false; return; }
    load();
  }, []);

  const openDetail = useCallback(async (client: ClientWithStats) => {
    try {
      const [fullClient, appointments] = await Promise.all([
        getClientById(client.id),
        getAppointments({ clientId: client.id }),
      ]);
      dispatch({
        type: 'SET_VIEWING_CLIENT',
        client: fullClient as ClientWithStats,
        appointments: appointments,
      });
    } catch {
      toast.error('Error al cargar datos');
    }
  }, []);

  const closeDetail = useCallback(() => {
    dispatch({ type: 'CLOSE_DETAIL' });
  }, []);

  const openEdit = useCallback(() => {
    dispatch({ type: 'SET_EDITING_CLIENT', client: ui.viewingClient });
  }, [ui.viewingClient]);

  const handleEditSave = useCallback(async (data: ClientInsert) => {
    if (!ui.viewingClient) return;
    dispatch({ type: 'SET_SAVING', saving: true });
    try {
      const normalized = normalizePeruPhone(data.phone);
      await updateClient(ui.viewingClient.id, { ...data, phone: normalized });
      toast.success('Datos actualizados');
      dispatch({ type: 'SET_EDITING_CLIENT', client: null });
      load();
      const [updated, updatedAppts] = await Promise.all([
        getClientById(ui.viewingClient.id),
        getAppointments({ clientId: ui.viewingClient.id }),
      ]);
      dispatch({
        type: 'SET_VIEWING_CLIENT',
        client: updated as ClientWithStats,
        appointments: updatedAppts as any[],
      });
    } catch {
      toast.error('Error al actualizar');
    } finally {
      dispatch({ type: 'SET_SAVING', saving: false });
    }
  }, [ui.viewingClient]);

  const handleDelete = useCallback(async () => {
    if (!ui.viewingClient) return;
    const confirmed = await confirm({
      title: 'Eliminar clienta',
      message: `¿Eliminar a ${ui.viewingClient.name}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    dispatch({ type: 'SET_DELETING', deleting: true });
    try {
      await deleteClient(ui.viewingClient.id);
      toast.success('Clienta eliminada');
      closeDetail();
      load();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      dispatch({ type: 'SET_DELETING', deleting: false });
    }
  }, [ui.viewingClient, confirm, closeDetail]);

  const handleCreate = useCallback(async (data: ClientInsert) => {
    dispatch({ type: 'SET_SUBMITTING', submitting: true });
    try {
      const normalized = normalizePeruPhone(data.phone);
      await createClient({ ...data, phone: normalized });
      toast.success('Clienta creada');
      dispatch({ type: 'SET_SHOW_CREATE_MODAL', show: false });
      load();
    } catch {
      toast.error('Error al crear');
    } finally {
      dispatch({ type: 'SET_SUBMITTING', submitting: false });
    }
  }, []);

  const handleSearchChange = useCallback((search: string) => {
    dispatch({ type: 'SET_SEARCH', search });
  }, []);

  const handleStatusFilterChange = useCallback((status: StatusFilter) => {
    dispatch({ type: 'SET_STATUS_FILTER', status });
  }, []);

  const handleShowMore = useCallback(() => {
    dispatch({ type: 'SET_VISIBLE_COUNT', count: ui.visibleCount + PAGE_SIZE });
  }, [ui.visibleCount]);

  const filteredClients = useMemo(() => {
    const bySearch = ui.clients.filter((c) =>
      c.name.toLowerCase().includes(ui.search.toLowerCase()) ||
      (c.phone || '').includes(ui.search) ||
      (c.instagram || '').toLowerCase().includes(ui.search.toLowerCase())
    );
    return ui.statusFilter === 'all'
      ? bySearch
      : bySearch.filter(c => c.status === ui.statusFilter);
  }, [ui.clients, ui.search, ui.statusFilter]);

  const totalVisible = filteredClients.length;

  const editInitialData = useMemo(() => {
    if (!ui.editingClient) return undefined;
    const c = ui.editingClient;
    return {
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      instagram: c.instagram || '',
      status: c.status,
      notes: c.notes || '',
      photo_url: c.photo_url,
    } satisfies ClientInsert;
  }, [ui.editingClient]);

  return (
    <>
      <Header title="Clientes" action={
        <Button size="sm" onClick={() => dispatch({ type: 'SET_SHOW_CREATE_MODAL', show: true })}>
          <Plus className="size-4 mr-1" /> Nueva
        </Button>
      } />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
        <ClientFilters
          search={ui.search}
          statusFilter={ui.statusFilter}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
        />

        <div aria-live="polite">
          <ClientListContent
            loading={ui.loading}
            clients={filteredClients}
            statusFilter={ui.statusFilter}
            search={ui.search}
            onClientClick={openDetail}
            onShowMore={handleShowMore}
            visibleCount={ui.visibleCount}
            totalVisible={totalVisible}
          />
        </div>
      </div>

      <ClientFormModal
        open={ui.showCreateModal}
        onClose={() => dispatch({ type: 'SET_SHOW_CREATE_MODAL', show: false })}
        onSave={handleCreate}
        submitting={ui.submitting}
      />

      <ClientDetailModal
        open={ui.showDetailModal}
        client={ui.viewingClient}
        appointments={ui.clientAppointments}
        onClose={closeDetail}
        onEdit={openEdit}
        onDelete={handleDelete}
        deleting={ui.deleting}
        loading={ui.loading && ui.showDetailModal}
      />

      {ui.editingClient && (
        <ClientFormModal
          open={!!ui.editingClient}
          onClose={() => dispatch({ type: 'SET_EDITING_CLIENT', client: null })}
          onSave={handleEditSave}
          initialData={editInitialData}
          title="Editar clienta"
          submitting={ui.saving}
        />
      )}
    </>
  );
}
