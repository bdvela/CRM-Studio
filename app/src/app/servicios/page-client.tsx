'use client';

import { useEffect, useRef, useReducer, useMemo, useCallback, lazy, Suspense } from 'react';
import {
  getServices,
  createService,
  updateService,
  deleteService,
  getCategories,
  getStaff,
  updateStaffServices,
} from '@/lib/db/queries';
import type { Service, ServiceInsert, Category, StaffMember, PriceType } from '@/types/database';
import { getCategoryName, getCategoryIdsFromStaffSpecialties } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/context/confirm-context';
import { ServiceListContent } from '@/components/servicios/ServiceListContent';
import type { ServiceForm, FormAction, ServiciosDataState, ServiciosUIState } from '@/components/servicios/types';

const ServicioFormModal = lazy(() =>
  import('@/components/servicios/ServicioFormModal').then(m => ({ default: m.ServicioFormModal }))
);

const SERVICIOS_DATA_INIT: ServiciosDataState = {
  services: [], categories: [], allStaff: [], loading: true, error: null,
};

function serviciosDataReducer(state: ServiciosDataState, action: Partial<ServiciosDataState>): ServiciosDataState {
  return { ...state, ...action };
}

function formReducer(state: ServiceForm, action: FormAction): ServiceForm {
  switch (action.type) {
    case 'UPDATE': return { ...state, ...action.payload };
    case 'SET': return action.payload;
    default: return state;
  }
}

const SERVICIOS_UI_INIT: ServiciosUIState = {
  submitting: false, showModal: false, editingService: null,
  deletingServiceId: null, search: '', categoryFilter: 'all',
  activeModalTab: 'basic', selectedStaffIds: [],
};

function serviciosUIReducer(state: ServiciosUIState, action: Partial<ServiciosUIState>): ServiciosUIState {
  return { ...state, ...action };
}

function getStaffForCategory(allStaff: StaffMember[], categoryId: string): StaffMember[] {
  return allStaff.filter(staff =>
    getCategoryIdsFromStaffSpecialties(staff).includes(categoryId)
  );
}

function getFilterOptions(services: Service[], categories: Category[]) {
  const options: { value: string; label: string }[] = [
    { value: 'all', label: `📋 Todos (${services.length})` }
  ];

  for (const cat of categories) {
    const count = services.filter(s => s.category_id === cat.id).length;
    options.push({
      value: cat.id,
      label: `${cat.icon || ''} ${cat.name} (${count})`
    });
  }

  return options;
}

export default function ServiciosPage({ initialData }: {
  initialData?: {
    services: Service[];
    categories: Category[];
    allStaff: StaffMember[];
  };
}) {
  const { confirm } = useConfirm();
  const [data, dispatchData] = useReducer(
    serviciosDataReducer,
    initialData
      ? {
          services: initialData.services,
          categories: initialData.categories,
          allStaff: initialData.allStaff,
          loading: false,
          error: null,
        }
      : SERVICIOS_DATA_INIT,
  );
  const [ui, dispatchUI] = useReducer(serviciosUIReducer, SERVICIOS_UI_INIT);

  const [form, dispatch] = useReducer(formReducer, {
    name: '',
    category_id: '',
    duration_min: 30,
    price: 0,
    price_type: 'fixed' as PriceType,
    price_from: null,
    price_to: null,
    description: '',
    image_url: null,
    active: true,
  });

  const initialFormRef = useRef<ServiceForm | null>(null);
  const initialStaffIdsRef = useRef<string[]>([]);
  const skipInitialLoad = useRef(!!initialData);

  async function load() {
    try {
      const [servicesData, categoriesData, staffData] = await Promise.all([
        getServices(true),
        getCategories(true),
        getStaff(true),
      ]);
      dispatchData({
        services: servicesData as Service[],
        categories: categoriesData as Category[],
        allStaff: staffData as StaffMember[],
        loading: false,
        error: null,
      });
    } catch (e) {
      dispatchData({ loading: false, error: 'Error al cargar servicios. Intenta de nuevo.' });
      console.error(e);
    }
  }

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      return;
    }

    load();
  }, []);

  const sortByName = (a: Service, b: Service) => a.name.localeCompare(b.name);

  const filteredBySearch = useMemo(() =>
    data.services
      .filter((s) =>
        s.name.toLowerCase().includes(ui.search.toLowerCase()) ||
        getCategoryName(s).toLowerCase().includes(ui.search.toLowerCase())
      )
      .sort(sortByName),
    [data.services, ui.search]
  );

  const filtered = useMemo(() => {
    const result = ui.categoryFilter === 'all'
      ? filteredBySearch
      : filteredBySearch.filter(s => s.category_id === ui.categoryFilter);
    return result;
  }, [filteredBySearch, ui.categoryFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    for (const svc of filtered) {
      const cat = getCategoryName(svc);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(svc);
    }
    for (const cat of Object.keys(groups)) {
      groups[cat].sort(sortByName);
    }
    return groups;
  }, [filtered]);

  const filterOptions = useMemo(() =>
    getFilterOptions(data.services, data.categories),
    [data.services, data.categories]
  );

  const categoryOptions = useMemo(() =>
    data.categories.flatMap(c => c.active ? [{
      value: c.id,
      label: `${c.icon || ''} ${c.name}`
    }] : []),
    [data.categories]
  );

  const resetForm = useCallback(() => {
    const defaultCat = data.categories.find(c => c.active) || data.categories[0];
    dispatch({ type: 'SET', payload: {
      name: '',
      category_id: defaultCat?.id || '',
      duration_min: 30,
      price: 0,
      price_type: 'fixed',
      price_from: null,
      price_to: null,
      description: '',
      image_url: null,
      active: true,
    }});
    dispatchUI({ selectedStaffIds: [], activeModalTab: 'basic' });
  }, [data.categories]);

  const openEdit = useCallback(async (svc: Service) => {
    const newForm: ServiceForm = {
      name: svc.name,
      category_id: svc.category_id,
      duration_min: svc.duration_min,
      price: Number(svc.price),
      price_type: (svc.price_type || 'fixed') as PriceType,
      price_from: svc.price_from,
      price_to: svc.price_to,
      description: svc.description || '',
      image_url: svc.image_url,
      active: svc.active,
    };

    const hasExplicitStaff = !!(svc.staff_services && svc.staff_services.length > 0);
    let newStaffIds: string[];
    if (hasExplicitStaff) {
      newStaffIds = (svc.staff_services || []).map(ss => ss.staff_id);
    } else {
      const suggestedStaff = getStaffForCategory(data.allStaff, svc.category_id);
      newStaffIds = suggestedStaff.map(s => s.id);
    }

    dispatchUI({ editingService: svc });
    dispatch({ type: 'SET', payload: newForm });
    initialFormRef.current = { ...newForm };
    dispatchUI({ selectedStaffIds: [...newStaffIds] });
    initialStaffIdsRef.current = [...newStaffIds];
    dispatchUI({ activeModalTab: 'basic', showModal: true });
  }, [data.allStaff]);

  const openNew = useCallback(async () => {
    dispatchUI({ editingService: null });
    resetForm();

    const defaultCat = data.categories.find(c => c.active) || data.categories[0];
    if (defaultCat) {
      const suggestedStaff = getStaffForCategory(data.allStaff, defaultCat.id);
      dispatchUI({ selectedStaffIds: suggestedStaff.map(s => s.id) });
    }

    dispatchUI({ showModal: true });
  }, [data.categories, data.allStaff, resetForm]);

  const handleCategoryChange = useCallback((newCategoryId: string) => {
    dispatch({ type: 'UPDATE', payload: { category_id: newCategoryId } });

    const suggestedStaff = getStaffForCategory(data.allStaff, newCategoryId);
    dispatchUI({ selectedStaffIds: suggestedStaff.map(s => s.id) });
  }, [data.allStaff]);

  const toggleStaffSelection = useCallback((staffId: string) => {
    dispatchUI({
      selectedStaffIds: ui.selectedStaffIds.includes(staffId)
        ? ui.selectedStaffIds.filter(id => id !== staffId)
        : [...ui.selectedStaffIds, staffId],
    });
  }, [ui.selectedStaffIds]);

  const isFormValid = useCallback((): boolean => {
    if (!form.name.trim()) return false;
    if (!form.category_id) return false;
    if (form.duration_min <= 0) return false;

    if (form.price_type === 'fixed') {
      if (form.price <= 0) return false;
    } else {
      if (form.price_from === null || form.price_from <= 0) return false;
      if (form.price_to !== null && form.price_to > 0 && form.price_to < form.price_from) return false;
    }

    return true;
  }, [form]);

  function haveFormChanges(): boolean {
    if (!ui.editingService || !initialFormRef.current) return true;

    const init = initialFormRef.current;
    if (form.name !== init.name) return true;
    if (form.category_id !== init.category_id) return true;
    if (form.duration_min !== init.duration_min) return true;
    if (form.price_type !== init.price_type) return true;
    if (form.price !== init.price) return true;
    if (form.price_from !== init.price_from) return true;
    if (form.price_to !== init.price_to) return true;
    if (form.description !== init.description) return true;
    if (form.image_url !== init.image_url) return true;
    if (form.active !== init.active) return true;

    if (ui.selectedStaffIds.length !== initialStaffIdsRef.current.length) return true;
    const sortedSelected = [...ui.selectedStaffIds].sort();
    const sortedInitial = [...initialStaffIdsRef.current].sort();
    if (sortedSelected.length === sortedInitial.length && !sortedSelected.every((id, i) => id === sortedInitial[i])) return true;

    return false;
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (ui.submitting) return;
    if (!isFormValid()) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    dispatchUI({ submitting: true });
    try {
      const serviceData: ServiceInsert = {
        name: form.name,
        category_id: form.category_id,
        duration_min: form.duration_min,
        price: form.price_type === 'fixed' ? form.price : (form.price_from || 0),
        price_type: form.price_type,
        price_from: form.price_type === 'variable' ? form.price_from : null,
        price_to: form.price_type === 'variable' ? form.price_to : null,
        description: form.description || null,
        image_url: form.image_url,
        active: form.active,
      };

      let savedServiceId: string;

      if (ui.editingService) {
        await updateService(ui.editingService.id, serviceData);
        savedServiceId = ui.editingService.id;
        toast.success('Servicio actualizado');
      } else {
        const newService = await createService(serviceData);
        savedServiceId = newService.id;
        toast.success('Servicio creado');
      }

      await updateStaffServices(savedServiceId, ui.selectedStaffIds);

      dispatchUI({ showModal: false, editingService: null });
      resetForm();
      load();
    } catch (e) {
      toast.error(ui.editingService ? 'Error al actualizar' : 'Error al crear');
    } finally {
      dispatchUI({ submitting: false });
    }
  }, [ui.submitting, ui.editingService, ui.selectedStaffIds, form, isFormValid, resetForm]);

  const toggleActive = useCallback(async (svc: Service) => {
    const confirmed = await confirm({
      title: 'Eliminar servicio',
      message: `¿Eliminar "${svc.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmed) return;
    try {
      await deleteService(svc.id);
      toast.success('Servicio eliminado');
      load();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  }, [confirm]);

  const handleDelete = useCallback(async () => {
    if (!ui.editingService) return;
    dispatchUI({ deletingServiceId: ui.editingService.id, showModal: false, editingService: null });
    await toggleActive(ui.editingService);
    dispatchUI({ deletingServiceId: null });
  }, [ui.editingService, toggleActive]);

  const handleModalClose = useCallback(() => {
    dispatchUI({ showModal: false, editingService: null });
  }, []);

  const handleSearchChange = useCallback((v: string) => {
    dispatchUI({ search: v });
  }, []);

  const handleCategoryFilterChange = useCallback((v: string) => {
    dispatchUI({ categoryFilter: v });
  }, []);

  const handleModalTabChange = useCallback((v: string) => {
    dispatchUI({ activeModalTab: v });
  }, []);

  return (
    <>
      <Header title="Servicios" action={
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4 mr-1" aria-hidden="true" /> Nuevo
        </Button>
      } />

      <ServiceListContent
        search={ui.search}
        categoryFilter={ui.categoryFilter}
        onSearchChange={handleSearchChange}
        onCategoryFilterChange={handleCategoryFilterChange}
        filterOptions={filterOptions}
        loading={data.loading}
        error={data.error}
        filtered={filtered}
        grouped={grouped}
        categories={data.categories}
        onOpenNew={openNew}
        openEdit={openEdit}
      />

      <Suspense fallback={<div className="p-8 flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-salon-300 border-t-transparent animate-spin" /></div>}>
        <ServicioFormModal
          open={ui.showModal}
          editingService={ui.editingService}
          form={form}
          dispatch={dispatch}
          activeModalTab={ui.activeModalTab}
          onActiveModalTabChange={handleModalTabChange}
          selectedStaffIds={ui.selectedStaffIds}
          deletingServiceId={ui.deletingServiceId}
          submitting={ui.submitting}
          allStaff={data.allStaff}
          categories={data.categories}
          categoryOptions={categoryOptions}
          onClose={handleModalClose}
          onCategoryChange={handleCategoryChange}
          onStaffToggle={toggleStaffSelection}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          isFormValid={isFormValid}
          haveFormChanges={haveFormChanges}
        />
      </Suspense>
    </>
  );
}
