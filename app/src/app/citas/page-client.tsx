'use client';

import { useEffect, useState, useRef, useReducer, useMemo, useCallback } from 'react';
import { getAppointments, getClients, getStaff, getServices } from '@/lib/db/queries';
import type { Client, Service, StaffMember } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CalendarView } from '@/components/citas/CalendarView';
import { AppointmentCard } from '@/components/citas/AppointmentCard';
import { AppointmentFormModalContent } from '@/components/citas/AppointmentFormModal';
import { CitasToolbar } from '@/components/citas/CitasToolbar';
import { DetailPopover } from '@/components/citas/DetailPopover';
import { ServiceConfigModalContent } from '@/components/citas/ServiceConfigModal';
import { ServiceSelectorModalContent } from '@/components/citas/ServiceSelectorModal';
import { useCitasHandlers } from '@/components/citas/hooks';
import { dataReducer, uiReducer, initialUiState } from '@/components/citas/reducers';
import type { AppointmentFormData, ViewMode, AppointmentWithDetails } from '@/components/citas/types';
import { cn, startOfToday, endOfToday } from '@/lib/utils';
import { CalendarDays, Plus } from 'lucide-react';
import { useConfirm } from '@/context/confirm-context';

function MobileViewTabs({ viewMode, onViewModeChange }: { viewMode: ViewMode; onViewModeChange: (mode: ViewMode) => void }) {
  return (
    <div className="sticky top-0 z-20 md:hidden px-4 py-2 bg-white/95 backdrop-blur border-b border-zinc-100 space-y-2">
      <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl shadow-sm">
        <button
          onClick={() => onViewModeChange('list')}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all',
            viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
          )}
        >
          Lista
        </button>
        <button
          onClick={() => onViewModeChange('calendar')}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all',
            viewMode === 'calendar' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
          )}
        >
          Calendario
        </button>
      </div>
    </div>
  );
}

function AppointmentListView({ loading, clientGroupedByDate, filterArtist, filterStatus, statusColors, onSelectAppt, onNew }: {
  loading: boolean;
  clientGroupedByDate: Record<string, AppointmentWithDetails[]>;
  filterArtist: string;
  filterStatus: string;
  statusColors: Record<string, 'info' | 'warning' | 'success' | 'danger'>;
  onSelectAppt: (appt: AppointmentWithDetails) => void;
  onNew: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {['skel-1', 'skel-2', 'skel-3'].map((k) => (
          <div key={k} className="h-24 sm:h-20 rounded-2xl bg-zinc-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (Object.keys(clientGroupedByDate).length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CalendarDays className="size-12 mx-auto mb-3 text-zinc-300" />
          <p className="text-sm text-zinc-500 mb-4">
            {filterArtist || filterStatus
              ? 'No hay citas con estos filtros'
              : 'No hay citas en este período'}
          </p>
          {!filterArtist && !filterStatus && (
            <Button size="sm" onClick={onNew}>
              <Plus className="size-4 mr-1" /> Crear primera cita
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      {Object.entries(clientGroupedByDate).map(([date, appts]) => (
        <div key={date} className="space-y-3">
          <h3 className="text-[11px] sm:text-sm font-semibold text-zinc-500 uppercase tracking-[0.18em] sm:tracking-wider px-0.5">
            {date}
          </h3>
          <div className="space-y-2 sm:space-y-2.5">
            {appts.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                statusColors={statusColors}
                onSelect={onSelectAppt}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

interface InitialData {
  appointments: AppointmentWithDetails[];
  staff: StaffMember[];
  services: Service[];
  clients: Client[];
}

export default function CitasPage({ initialData }: { initialData?: InitialData }) {
  const { confirm } = useConfirm();
  const [data, dispatchData] = useReducer(dataReducer, {
    appointments: initialData?.appointments || [],
    staff: initialData?.staff || [],
    services: initialData?.services || [],
    clients: initialData?.clients || [],
    loading: !initialData,
    submitting: false,
  });
  const { appointments, staff, services, clients, loading, submitting } = data;
  const [ui, dispatchUi] = useReducer(uiReducer, initialUiState);
  const { viewMode, listFilter, filterArtist, filterStatus, showModal, showDetail, showServiceConfig, showServiceSelector, overlapWarning, pendingDate, advancePaid } = ui;
  const [selectedAppt, setSelectedAppt] = useState<AppointmentWithDetails | null>(null);

  const [formMeta, setFormMeta] = useState({
    editingAppt: null as AppointmentWithDetails | null,
    selectedServices: [] as string[],
    serviceArtists: {} as Record<string, string>,
    customPrices: {} as Record<string, number>,
    configuringServiceId: null as string | null,
  });
  const { editingAppt, selectedServices, serviceArtists, customPrices, configuringServiceId } = formMeta;

  function setEditingAppt(v: AppointmentWithDetails | null) { setFormMeta(prev => ({ ...prev, editingAppt: v })); }
  function setSelectedServices(v: string[]) { setFormMeta(prev => ({ ...prev, selectedServices: v })); }
  function setServiceArtists(v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) {
    setFormMeta(prev => ({ ...prev, serviceArtists: typeof v === 'function' ? v(prev.serviceArtists) : v }));
  }
  function setCustomPrices(v: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) {
    setFormMeta(prev => ({ ...prev, customPrices: typeof v === 'function' ? v(prev.customPrices) : v }));
  }
  function setConfiguringServiceId(v: string | null) { setFormMeta(prev => ({ ...prev, configuringServiceId: v })); }

  const initialForm = useRef<AppointmentFormData | null>(null);
  const initialSelectedServices = useRef<string[]>([]);
  const initialServiceArtists = useRef<Record<string, string>>({});
  const initialCustomPrices = useRef<Record<string, number>>({});
  const initialAdvancePaid = useRef<boolean>(false);

  const [form, setForm] = useState<AppointmentFormData>({
    client_id: '',
    start_time: '',
    status: 'programada',
    notes: '',
    color: '',
  });
  const skipInitialAppointmentsLoad = useRef(true);

  async function loadInitialData() {
    dispatchData({ type: 'LOAD_START' });
    try {
      const [appts, s, svcs, cls] = await Promise.all([
        getAppointments({ dateFrom: startOfToday() }),
        getStaff(),
        getServices(false),
        getClients(),
      ]);
      dispatchData({
        type: 'LOAD_COMPLETE',
        appointments: appts as AppointmentWithDetails[],
        staff: s as StaffMember[],
        services: svcs as Service[],
        clients: cls as Client[],
      });
    } catch (e) {
      console.error(e);
    }
  }

  const loadAppointments = useCallback(async () => {
    dispatchData({ type: 'LOAD_START' });
    try {
      let dateFrom: string | undefined;
      let dateTo: string | undefined;

      if (listFilter === 'list') {
        dateFrom = startOfToday();
      } else if (listFilter === 'day') {
        dateFrom = startOfToday();
        dateTo = endOfToday();
      } else if (listFilter === 'week') {
        dateFrom = startOfToday();
      }

      const filter: Record<string, string> = {};
      if (dateFrom) filter.dateFrom = dateFrom;
      if (dateTo) filter.dateTo = dateTo;
      if (filterArtist) filter.artistId = filterArtist;
      if (filterStatus) filter.status = filterStatus;

      const appts = await getAppointments(filter);
      dispatchData({ type: 'SET_APPOINTMENTS', appointments: appts as AppointmentWithDetails[] });
    } catch (e) {
      console.error(e);
    }
  }, [listFilter, filterArtist, filterStatus]);

  useEffect(() => {
    if (initialData) return;
    loadInitialData();
  }, [initialData]);

  useEffect(() => {
    if (skipInitialAppointmentsLoad.current) {
      skipInitialAppointmentsLoad.current = false;
      return;
    }
    loadAppointments();
  }, [loadAppointments]);

  const visibleAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (filterArtist && appt.artist_id !== filterArtist) return false;
      if (filterStatus && appt.status !== filterStatus) return false;
      return true;
    });
  }, [appointments, filterArtist, filterStatus]);

  const clientGroupedByDate = useMemo(() =>
    visibleAppointments.reduce((acc, appt) => {
      const date = new Date(appt.start_time).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!acc[date]) acc[date] = [];
      acc[date].push(appt);
      return acc;
    }, {} as Record<string, AppointmentWithDetails[]>)
  , [visibleAppointments]);

  const {
    totalDuration, calculateTotalPrice, haveChanges, checkForOverlap, handleSubmit,
    openEdit, openNew, openNewForDate, cancelAppt, advanceStatus, markAsNoShow,
    deleteAppt, updateApptDate, statusColors, canDeleteAppt,
  } = useCitasHandlers({
    staff, services, appointments, editingAppt, selectedServices, serviceArtists,
    customPrices, overlapWarning, advancePaid, submitting, form, selectedAppt,
    pendingDate, listFilter, filterArtist, filterStatus,
    setForm, setEditingAppt, setSelectedServices, setServiceArtists, setCustomPrices,
    dispatchData, dispatchUi, confirm, load: loadAppointments,
    initialForm, initialSelectedServices, initialServiceArtists,
    initialCustomPrices, initialAdvancePaid,
  });

  return (
    <>
      <Header title="Citas" action={
        <div className="flex items-center gap-3">
          <div className="hidden md:flex gap-1 p-1 bg-zinc-100 rounded-xl">
            <button
              onClick={() => dispatchUi({ type: 'SET_VIEW_MODE', viewMode: 'list' })}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5',
                viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              )}
            >
              Lista
            </button>
            <button
              onClick={() => dispatchUi({ type: 'SET_VIEW_MODE', viewMode: 'calendar' })}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5',
                viewMode === 'calendar' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              )}
            >
              Calendario
            </button>
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="size-4 mr-1" /> Nueva
          </Button>
        </div>
      } />

      <MobileViewTabs viewMode={viewMode} onViewModeChange={(mode) => dispatchUi({ type: 'SET_VIEW_MODE', viewMode: mode })} />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
        {viewMode === 'list' && (
          <CitasToolbar
            viewMode={viewMode}
            listFilter={listFilter}
            filterArtist={filterArtist}
            filterStatus={filterStatus}
            staff={staff}
            appointments={visibleAppointments}
            onViewModeChange={(mode) => dispatchUi({ type: 'SET_VIEW_MODE', viewMode: mode })}
            onListFilterChange={(filter) => dispatchUi({ type: 'SET_LIST_FILTER', listFilter: filter })}
            onFilterArtistChange={(artistId) => dispatchUi({ type: 'SET_FILTER_ARTIST', filterArtist: artistId })}
            onFilterStatusChange={(status) => dispatchUi({ type: 'SET_FILTER_STATUS', filterStatus: status })}
            onClearFilters={() => dispatchUi({ type: 'CLEAR_FILTERS' })}
          />
        )}

        {viewMode === 'calendar' ? (
          loading ? (
            <div className="space-y-3">
              <div className="h-10 rounded-xl bg-zinc-100 animate-pulse" />
              <div className="h-96 rounded-2xl bg-zinc-100 animate-pulse" />
            </div>
          ) : visibleAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="size-12 mx-auto mb-3 text-zinc-300" />
                <p className="text-sm text-zinc-500 mb-4">No hay citas en este período</p>
                <Button size="sm" onClick={openNew}>
                  <Plus className="size-4 mr-1" /> Crear primera cita
                </Button>
              </CardContent>
            </Card>
          ) : (
            <CalendarView
              appointments={visibleAppointments}
              staff={staff}
              onEdit={openEdit}
              onCancel={cancelAppt}
              onNew={(date) => openNewForDate(date)}
              onUpdateDate={updateApptDate}
              onAdvanceStatus={advanceStatus}
              onMarkAsNoShow={markAsNoShow}
            />
          )
        ) : (
          <AppointmentListView
            loading={loading}
            clientGroupedByDate={clientGroupedByDate}
            filterArtist={filterArtist}
            filterStatus={filterStatus}
            statusColors={statusColors}
            onNew={openNew}
            onSelectAppt={(appt) => {
              setSelectedAppt(appt);
              dispatchUi({ type: 'SET_SHOW_DETAIL', showDetail: true });
            }}
          />
        )}
      </div>

      <DetailPopover
        show={showDetail}
        selectedAppt={selectedAppt}
        statusColors={statusColors}
        onClose={() => { dispatchUi({ type: 'SET_SHOW_DETAIL', showDetail: false }); setSelectedAppt(null); }}
        onEdit={(appt) => { openEdit(appt); }}
        onCancel={cancelAppt}
        onAdvanceStatus={advanceStatus}
        onMarkAsNoShow={markAsNoShow}
      />

      <Modal open={showModal} onClose={() => { dispatchUi({ type: 'SET_SHOW_MODAL', showModal: false }); setEditingAppt(null); }} title={editingAppt ? `Editar Cita (${selectedServices.length} servicio${selectedServices.length !== 1 ? 's' : ''})` : selectedServices.length > 0 ? `Nueva Cita (${selectedServices.length} servicio${selectedServices.length !== 1 ? 's' : ''})` : 'Nueva Cita'}>
          <AppointmentFormModalContent
          open={showModal}
          editingAppt={editingAppt}
          form={form}
          clients={clients}
          selectedServices={selectedServices}
          serviceArtists={serviceArtists}
          customPrices={customPrices}
          services={services}
          staff={staff}
          overlapWarning={overlapWarning}
          advancePaid={advancePaid}
          submitting={submitting}
          canDelete={canDeleteAppt}
          totalDuration={totalDuration}
          haveChanges={haveChanges}
          calculateTotalPrice={calculateTotalPrice}
          onFormChange={(updates) => setForm(prev => ({ ...prev, ...updates }))}
          onStartTimeChange={(v) => { setForm(prev => ({ ...prev, start_time: v })); checkForOverlap(); }}
          onSubmit={handleSubmit}
          onDelete={deleteAppt}
          onClose={() => { dispatchUi({ type: 'SET_SHOW_MODAL', showModal: false }); setEditingAppt(null); }}
          onOpenServiceSelector={() => dispatchUi({ type: 'SET_SHOW_SERVICE_SELECTOR', showServiceSelector: true })}
          onOpenServiceConfig={(serviceId) => { setConfiguringServiceId(serviceId); dispatchUi({ type: 'SET_SHOW_SERVICE_CONFIG', showServiceConfig: true }); }}
          onToggleAdvancePaid={() => dispatchUi({ type: 'SET_ADVANCE_PAID', advancePaid: !advancePaid })}
        />
      </Modal>

      <Modal
        open={showServiceConfig}
        onClose={() => dispatchUi({ type: 'SET_SHOW_SERVICE_CONFIG', showServiceConfig: false })}
        title={(() => {
          const svc = services.find(s => s.id === configuringServiceId);
          return `⚙️ Configurar: ${svc?.name || 'Servicio'}`;
        })()}
      >
        <ServiceConfigModalContent
          key={configuringServiceId || 'none'}
          open={showServiceConfig}
          serviceId={configuringServiceId}
          services={services}
          staff={staff}
          currentArtistId={serviceArtists[configuringServiceId || ''] || ''}
          currentPrice={customPrices[configuringServiceId || ''] ?? null}
          onSave={({ serviceId, artistId, price }) => {
            if (artistId) {
              setServiceArtists(prev => ({ ...prev, [serviceId]: artistId }));
            } else {
              const newMap = { ...serviceArtists };
              delete newMap[serviceId];
              setServiceArtists(newMap);
            }
            if (price !== null) {
              setCustomPrices(prev => ({ ...prev, [serviceId]: price }));
            }
            checkForOverlap();
            dispatchUi({ type: 'SET_SHOW_SERVICE_CONFIG', showServiceConfig: false });
          }}
          onRemove={async (serviceId) => {
            const svc = services.find(s => s.id === serviceId);
            if (!svc) return;
            const confirmed = await confirm({
              title: 'Quitar servicio',
              message: `¿Quitar "${svc.name}" de la cita?`,
              confirmText: 'Quitar',
              cancelText: 'Cancelar',
              variant: 'warning',
            });
            if (!confirmed) return;
            setSelectedServices(selectedServices.filter(id => id !== serviceId));
            const newMap = { ...serviceArtists };
            delete newMap[serviceId];
            setServiceArtists(newMap);
            const newPrices = { ...customPrices };
            delete newPrices[serviceId];
            setCustomPrices(newPrices);
            checkForOverlap();
            dispatchUi({ type: 'SET_SHOW_SERVICE_CONFIG', showServiceConfig: false });
          }}
          onClose={() => dispatchUi({ type: 'SET_SHOW_SERVICE_CONFIG', showServiceConfig: false })}
        />
      </Modal>

      <Modal
        open={showServiceSelector}
        onClose={() => dispatchUi({ type: 'SET_SHOW_SERVICE_SELECTOR', showServiceSelector: false })}
        title="Seleccionar servicios"
      >
        <ServiceSelectorModalContent
          open={showServiceSelector}
          services={services}
          staff={staff}
          initialSelectedIds={selectedServices}
          initialArtists={serviceArtists}
          initialPrices={customPrices}
          onConfirm={({ selectedIds, artists, prices }) => {
            setSelectedServices(selectedIds);
            setServiceArtists(artists);
            setCustomPrices(prices);
            checkForOverlap();
            dispatchUi({ type: 'SET_SHOW_SERVICE_SELECTOR', showServiceSelector: false });
          }}
          onClose={() => dispatchUi({ type: 'SET_SHOW_SERVICE_SELECTOR', showServiceSelector: false })}
        />
      </Modal>
    </>
  );
}
