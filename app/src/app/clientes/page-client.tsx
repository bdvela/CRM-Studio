'use client';

import { useEffect, useReducer, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getClients, createClient, updateClient, deleteClient, getClientById, getAppointments } from '@/lib/db/queries';
import type { Client, ClientInsert, Appointment } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/context/confirm-context';
import { normalizePeruPhone } from '@/lib/utils';
import { PAGE_SIZE } from '@/components/clientes/constants';
import type { ClientesUIState, ClientesUIAction, StatusFilter, ClientWithStats } from '@/components/clientes/types';
import { ClientFilters } from '@/components/clientes/ClientFilters';
import { ClientListContent } from '@/components/clientes/ClientListContent';

const ClientFormModal = lazy(() =>
  import('@/components/clientes/ClientFormModal').then(m => ({ default: m.ClientFormModal }))
);
const ClientDetailModal = lazy(() =>
  import('@/components/clientes/ClientDetailModal').then(m => ({ default: m.ClientDetailModal }))
);

const UI_INIT: ClientesUIState = {
  clients: [],
  loading: false,
  error: null,
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
  appointmentsLoading: false,
  visibleCount: PAGE_SIZE,
};

function uiReducer(state: ClientesUIState, action: ClientesUIAction): ClientesUIState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.loading };
    case 'SET_ERROR': return { ...state, error: action.error, loading: false };
    case 'SET_CLIENTS': return { ...state, loading: false, error: null, clients: action.clients };
    case 'SET_SUBMITTING': return { ...state, submitting: action.submitting };
    case 'SET_SHOW_CREATE_MODAL': return { ...state, showCreateModal: action.show };
    case 'SET_SHOW_DETAIL_MODAL': return { ...state, showDetailModal: action.show };
    case 'SET_VIEWING_CLIENT': return { ...state, viewingClient: action.client, clientAppointments: action.appointments || state.clientAppointments, showDetailModal: true };
    case 'SET_EDITING_CLIENT': return { ...state, editingClient: action.client };
    case 'SET_SEARCH': return { ...state, search: action.search, visibleCount: PAGE_SIZE };
    case 'SET_STATUS_FILTER': return { ...state, statusFilter: action.status, visibleCount: PAGE_SIZE };
    case 'SET_SAVING': return { ...state, saving: action.saving };
    case 'SET_DELETING': return { ...state, deleting: action.deleting };
    case 'SET_APPOINTMENTS_LOADING': return { ...state, appointmentsLoading: action.loading };
    case 'CLOSE_DETAIL': return { ...state, showDetailModal: false, viewingClient: null, editingClient: null, clientAppointments: [] };
    case 'SET_VISIBLE_COUNT': return { ...state, visibleCount: action.count };
    case 'RESET': return { ...UI_INIT, loading: true };
    default: return state;
  }
}

export default function ClientesPage({ initialClients }: { initialClients?: Client[] }) {
  const { push } = useRouter();
  const { confirm } = useConfirm();
  const [ui, dispatch] = useReducer(uiReducer, { ...UI_INIT, clients: initialClients || [] as ClientWithStats[], loading: !initialClients });
  const loaded = useRef(!!initialClients);

  async function load() {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const data = await getClients();
      dispatch({ type: 'SET_CLIENTS', clients: data as ClientWithStats[] });
    } catch {
      dispatch({ type: 'SET_ERROR', error: 'Error al cargar clientas' });
    }
  }

  useEffect(() => {
    if (loaded.current) { loaded.current = false; return; }
    load();
  }, []);

  // Prefetch modal chunk so first card click is instant
  useEffect(() => {
    const id = setTimeout(() => {
      import('@/components/clientes/ClientDetailModal');
    }, 500);
    return () => clearTimeout(id);
  }, []);

  // Auto-refresh every 60s, pause when tab hidden
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = setInterval(load, 60000);

    function handleVisibility() {
      if (document.hidden && interval) {
        clearInterval(interval);
        interval = null;
      } else if (!document.hidden && !interval) {
        interval = setInterval(load, 60000);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const openDetail = useCallback((client: ClientWithStats) => {
    dispatch({ type: 'SET_APPOINTMENTS_LOADING', loading: true });
    dispatch({
      type: 'SET_VIEWING_CLIENT',
      client,
      appointments: [],
    });

    Promise.all([
      getClientById(client.id),
      getAppointments({ clientId: client.id }),
    ])
      .then(([fullClient, appts]) => {
        dispatch({
          type: 'SET_VIEWING_CLIENT',
          client: fullClient as ClientWithStats,
          appointments: appts as Appointment[],
        });
        dispatch({ type: 'SET_APPOINTMENTS_LOADING', loading: false });
      })
      .catch(() => {
        dispatch({ type: 'SET_APPOINTMENTS_LOADING', loading: false });
      });
  }, []);

  const closeDetail = useCallback(() => {
    dispatch({ type: 'CLOSE_DETAIL' });
  }, []);

  const openEdit = useCallback(() => {
    dispatch({ type: 'SET_EDITING_CLIENT', client: ui.viewingClient });
    dispatch({ type: 'SET_SHOW_DETAIL_MODAL', show: false });
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
        appointments: updatedAppts as Appointment[],
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
        {ui.error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            <AlertTriangle className="size-4 flex-shrink-0" />
            <span className="flex-1">{ui.error}</span>
            <button onClick={() => dispatch({ type: 'SET_ERROR', error: null })} className="text-red-400 hover:text-red-600" aria-label="Descartar error">&times;</button>
          </div>
        )}

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
            onOpenNew={() => dispatch({ type: 'SET_SHOW_CREATE_MODAL', show: true })}
          />
        </div>
      </div>

      <Suspense fallback={<div className="p-8 flex items-center justify-center"><div className="size-8 rounded-full border-2 border-salon-300 border-t-transparent animate-spin" /></div>}>
        <ClientFormModal
          open={ui.showCreateModal}
          onClose={() => dispatch({ type: 'SET_SHOW_CREATE_MODAL', show: false })}
          onSave={handleCreate}
          submitting={ui.submitting}
        />
      </Suspense>

      <Suspense fallback={<div className="p-8 flex items-center justify-center"><div className="size-8 rounded-full border-2 border-salon-300 border-t-transparent animate-spin" /></div>}>
        <ClientDetailModal
          open={ui.showDetailModal}
          client={ui.viewingClient}
          appointments={ui.clientAppointments}
          appointmentsLoading={ui.appointmentsLoading}
          onClose={closeDetail}
          onEdit={openEdit}
          onDelete={handleDelete}
          onViewDetail={() => { if (ui.viewingClient) { closeDetail(); push(`/clientes/${ui.viewingClient.id}`); } }}
          deleting={ui.deleting}
        />
      </Suspense>

      {ui.editingClient && (
        <Suspense fallback={<div className="p-8 flex items-center justify-center"><div className="size-8 rounded-full border-2 border-salon-300 border-t-transparent animate-spin" /></div>}>
          <ClientFormModal
            open={!!ui.editingClient}
            onClose={() => dispatch({ type: 'SET_EDITING_CLIENT', client: null })}
            onSave={handleEditSave}
            initialData={editInitialData}
            title="Editar clienta"
            submitting={ui.saving}
          />
        </Suspense>
      )}
    </>
  );
}
