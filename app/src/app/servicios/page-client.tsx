'use client';

import { useEffect, useState, useRef, useReducer } from 'react';
import { 
  getServices, 
  createService, 
  updateService, 
  deleteService, 
  getCategories,
  getStaff,
  getStaffForService,
  updateStaffServices,
} from '@/lib/db/queries';
import type { Service, ServiceInsert, Category, StaffMember, PriceType, StaffService } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { Tabs } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatServicePrice } from '@/lib/utils';
import { getCategoryName, getCategoryColor, getCategoryIcon, getCategoryIdsFromStaffSpecialties } from '@/types/database';
import { 
  Palette, 
  Plus, 
  Search, 
  Clock, 
  Users,
  Trash2 
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/context/confirm-context';

interface ServiceForm extends Omit<ServiceInsert, 'price_type' | 'price_from' | 'price_to'> {
  price_type: PriceType;
  price_from: number | null;
  price_to: number | null;
}

const MODAL_TAB_BASIC = 'basic';
const MODAL_TAB_STAFF = 'staff';

type FormAction =
  | { type: 'UPDATE'; payload: Partial<ServiceForm> }
  | { type: 'SET'; payload: ServiceForm };

function formReducer(state: ServiceForm, action: FormAction): ServiceForm {
  switch (action.type) {
    case 'UPDATE': return { ...state, ...action.payload };
    case 'SET': return action.payload;
    default: return state;
  }
}

function ServiceFilter({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  getFilterOptions,
}: {
  search: string;
  onSearchChange: (s: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (s: string) => void;
  getFilterOptions: () => { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar servicio..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500"
        />
      </div>
      <div className="w-full sm:w-48 sm:flex-shrink-0">
        <Select
          value={categoryFilter}
          onChange={onCategoryFilterChange}
          options={getFilterOptions()}
          placeholder="Categoría"
        />
      </div>
    </div>
  );
}

function ServiceCard({ 
  service, 
  onClick 
}: { 
  service: Service; 
  onClick: (s: Service) => void;
}) {
  const hasExplicitStaff = service.staff_services && service.staff_services.length > 0;
  
  return (
    <Card 
      className={`hover:shadow-md transition-all ${!service.active ? 'opacity-60' : ''} cursor-pointer`}
      onClick={() => onClick(service)}
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{service.name}</p>
              {hasExplicitStaff && (
                <Badge variant="default" className="text-xs">
                  <Users className="size-3 mr-1" />
                  {service.staff_services?.length || 0}
                </Badge>
              )}
            </div>
            {service.description && (
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{service.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="size-4" />
            {service.duration_min} min
          </span>
          <span className={`font-semibold ${
            service.price_type === 'variable' ? 'text-amber-600' : 'text-salon-600'
          }`}>
            {formatServicePrice({
              price_type: service.price_type,
              price: service.price,
              price_from: service.price_from,
              price_to: service.price_to,
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceListContent({
  search, categoryFilter, onSearchChange, onCategoryFilterChange,
  getFilterOptions, loading, filtered, grouped, categories, openEdit,
}: {
  search: string;
  categoryFilter: string;
  onSearchChange: (v: string) => void;
  onCategoryFilterChange: (v: string) => void;
  getFilterOptions: () => { value: string; label: string }[];
  loading: boolean;
  filtered: Service[];
  grouped: Record<string, Service[]>;
  categories: Category[];
  openEdit: (svc: Service) => void;
}) {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
      <ServiceFilter
        search={search}
        onSearchChange={onSearchChange}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={onCategoryFilterChange}
        getFilterOptions={getFilterOptions}
      />

      <div className="flex items-center gap-4 text-sm text-zinc-500">
        <span>{filtered.length} servicios</span>
        {categoryFilter !== 'all' && (
          <>
            <span>·</span>
            <span className="text-salon-600 font-medium">
              Filtrado: {categories.find(c => c.id === categoryFilter)?.name || 'Categoría'}
            </span>
          </>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => <div key={`sk-${n}`} className="h-16 rounded-2xl bg-zinc-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-400">
            <Palette className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay servicios {search || categoryFilter !== 'all' ? 'que coincidan' : 'registrados'}</p>
          </CardContent>
        </Card>
      ) : categoryFilter === 'all' ? (
        Object.entries(grouped).map(([category, svcs]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Badge variant="custom" color={svcs[0]?.category?.color || '#6B7280'}>{category}</Badge>
              <span className="text-xs text-zinc-400">({svcs.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {svcs.map((svc) => <ServiceCard key={svc.id} service={svc} onClick={openEdit} />)}
            </div>
          </div>
        ))
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((svc) => <ServiceCard key={svc.id} service={svc} onClick={openEdit} />)}
        </div>
      )}
    </div>
  );
}

function ServicioStaffTab({
  allStaff, categories, formCategoryId,
  selectedStaffIds, onStaffToggle,
}: {
  allStaff: StaffMember[];
  categories: Category[];
  formCategoryId: string;
  selectedStaffIds: string[];
  onStaffToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <span className="text-sm font-medium text-zinc-700">
          Artistas que brindan este servicio
        </span>
        <p className="text-xs text-zinc-400">
          Pre-seleccionados según la categoría. Puedes marcar/desmarcar cualquiera.
        </p>
      </div>
        
      {allStaff.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-4">No hay staff registrado</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {allStaff.map((staff) => {
            const hasSpecialty = getCategoryIdsFromStaffSpecialties(staff).includes(formCategoryId);
            const isSelected = selectedStaffIds.includes(staff.id);
            
            return (
              <div 
                key={staff.id}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => onStaffToggle(staff.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onStaffToggle(staff.id);
                  }
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-salon-400 bg-salon-50'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => onStaffToggle(staff.id)}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{staff.name}</p>
                      {staff.role?.name && (
                        <Badge 
                          variant="custom" 
                          color={staff.role.color || '#6B7280'}
                          className="text-xs"
                        >
                          {staff.role.name}
                        </Badge>
                      )}
                      {hasSpecialty && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          sugerido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {getCategoryIdsFromStaffSpecialties(staff).length > 0
                        ? `Especialidades: ${getCategoryIdsFromStaffSpecialties(staff).map(cid => {
                            const cat = categories.find(c => c.id === cid);
                            return cat?.icon || '';
                          }).join(' ')}`
                        : 'Sin especialidades'
                      }
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedStaffIds.length === 0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-700">
            ⚠️ Sin artistas seleccionados. El servicio usará asignación por categoría (todos los artistas con la categoría podrán brindarlo).
          </p>
        </div>
      )}
    </div>
  );
}

function ServicioFormModal({
  open, editingService, form, dispatch,
  activeModalTab, onActiveModalTabChange,
  selectedStaffIds, deletingServiceId, submitting,
  allStaff, categories, categoryOptions,
  onClose, onCategoryChange, onStaffToggle, onSubmit, onDelete,
  isFormValid, haveFormChanges,
}: {
  open: boolean;
  editingService: Service | null;
  form: ServiceForm;
  dispatch: React.Dispatch<FormAction>;
  activeModalTab: string;
  onActiveModalTabChange: (v: string) => void;
  selectedStaffIds: string[];
  deletingServiceId: string | null;
  submitting: boolean;
  allStaff: StaffMember[];
  categories: Category[];
  categoryOptions: { value: string; label: string }[];
  onClose: () => void;
  onCategoryChange: (id: string) => void;
  onStaffToggle: (id: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onDelete: () => Promise<void>;
  isFormValid: () => boolean;
  haveFormChanges: () => boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Tabs
          tabs={[
            { id: MODAL_TAB_BASIC, label: 'Datos Básicos', icon: <Palette className="size-4" /> },
            { id: MODAL_TAB_STAFF, label: 'Staff', icon: <Users className="size-4" /> },
          ]}
          active={activeModalTab}
          onChange={onActiveModalTabChange}
        />

        {activeModalTab === MODAL_TAB_BASIC && (
          <div className="space-y-4 pt-2">
            <Input 
              label="Nombre *" 
              value={form.name} 
              onChange={(value) => dispatch({ type: 'UPDATE', payload: { name: value } })} 
              placeholder="Ej: Manicure semipermanente" 
              minLength={2}
              maxLength={100}
            />
            
            <Select 
              label="Categoría *" 
              value={form.category_id} 
              onChange={onCategoryChange} 
              options={categoryOptions} 
            />
            
            <Input 
              label="Duración (min) *" 
              type="number" 
              value={form.duration_min} 
              onChange={(value) => dispatch({ type: 'UPDATE', payload: { duration_min: parseInt(value) || 0 } })} 
              min={5}
              max={480}
            />

            <div className="space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Precio</span>
              
              {form.price_type === 'fixed' ? (
                <div className="flex gap-2 items-start">
                  <div className="w-36 flex-shrink-0">
                    <Select
                      value={form.price_type}
                      onChange={(value) => dispatch({ type: 'UPDATE', payload: { price_type: value as PriceType } })}
                      options={[
                        { value: 'fixed', label: 'Fijo' },
                        { value: 'variable', label: 'Variable' },
                      ]}
                    />
                  </div>
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <span className="text-zinc-400 text-sm font-medium select-none">S/</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price || ''}
                      onChange={(e) => dispatch({ type: 'UPDATE', payload: { price: parseFloat(e.target.value) || 0 } })}
                      placeholder="0.00"
                      className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent placeholder:text-zinc-300"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 items-start md:hidden">
                    <div className="w-full">
                      <Select
                        value={form.price_type}
                        onChange={(value) => dispatch({ type: 'UPDATE', payload: { price_type: value as PriceType } })}
                        options={[
                          { value: 'fixed', label: 'Fijo' },
                          { value: 'variable', label: 'Variable' },
                        ]}
                      />
                    </div>
                    <div className="w-full flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                          <span className="text-zinc-400 text-sm font-medium select-none">S/</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={form.price_from ?? ''}
                          onChange={(e) => dispatch({ type: 'UPDATE', payload: { price_from: e.target.value ? parseFloat(e.target.value) : null } })}
                          placeholder="Desde"
                          className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent placeholder:text-zinc-300"
                        />
                      </div>
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                          <span className="text-zinc-400 text-sm font-medium select-none">S/</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={form.price_to ?? ''}
                          onChange={(e) => dispatch({ type: 'UPDATE', payload: { price_to: e.target.value ? parseFloat(e.target.value) : null } })}
                          placeholder="Hasta"
                          className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent placeholder:text-zinc-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex gap-2 items-start">
                    <div className="w-36 flex-shrink-0">
                      <Select
                        value={form.price_type}
                        onChange={(value) => dispatch({ type: 'UPDATE', payload: { price_type: value as PriceType } })}
                        options={[
                          { value: 'fixed', label: 'Fijo' },
                          { value: 'variable', label: 'Variable' },
                        ]}
                      />
                    </div>
                    <div className="flex-1 flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                          <span className="text-zinc-400 text-sm font-medium select-none">S/</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={form.price_from ?? ''}
                          onChange={(e) => dispatch({ type: 'UPDATE', payload: { price_from: e.target.value ? parseFloat(e.target.value) : null } })}
                          placeholder="Desde"
                          className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent placeholder:text-zinc-300"
                        />
                      </div>
                      <div className="flex items-center justify-center px-1">
                        <span className="text-zinc-400 text-lg font-light">-</span>
                      </div>
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                          <span className="text-zinc-400 text-sm font-medium select-none">S/</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={form.price_to ?? ''}
                          onChange={(e) => dispatch({ type: 'UPDATE', payload: { price_to: e.target.value ? parseFloat(e.target.value) : null } })}
                          placeholder="Hasta"
                          className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent placeholder:text-zinc-300"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <Textarea 
              label="Descripción" 
              value={form.description || ''} 
              onChange={(value) => dispatch({ type: 'UPDATE', payload: { description: value } })} 
              placeholder="Descripción del servicio..." 
              maxLength={500}
            />
          </div>
        )}

        {activeModalTab === MODAL_TAB_STAFF && (
          <ServicioStaffTab
            allStaff={allStaff}
            categories={categories}
            formCategoryId={form.category_id}
            selectedStaffIds={selectedStaffIds}
            onStaffToggle={onStaffToggle}
          />
        )}

        <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 mt-2 border-t border-zinc-100">
          {editingService && (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 order-last sm:order-none"
              loading={deletingServiceId === editingService.id}
              onClick={onDelete}
            >
              {deletingServiceId !== editingService.id && <Trash2 className="size-4 mr-1" />}
              {deletingServiceId === editingService.id ? 'Eliminando...' : 'Eliminar'}
            </Button>
          )}
          
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
              type="submit" 
              className="flex-1" 
              loading={submitting}
              disabled={!isFormValid() || !!(editingService && !haveFormChanges())}
            >
              {submitting ? 'Guardando...' : (editingService ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

interface ServiciosDataState {
  services: Service[];
  categories: Category[];
  allStaff: StaffMember[];
  loading: boolean;
}

const SERVICIOS_DATA_INIT: ServiciosDataState = {
  services: [], categories: [], allStaff: [], loading: true,
};

function serviciosDataReducer(state: ServiciosDataState, action: Partial<ServiciosDataState>): ServiciosDataState {
  return { ...state, ...action };
}

interface ServiciosUIState {
  submitting: boolean;
  showModal: boolean;
  editingService: Service | null;
  deletingServiceId: string | null;
  search: string;
  categoryFilter: string;
  activeModalTab: string;
  selectedStaffIds: string[];
}

const SERVICIOS_UI_INIT: ServiciosUIState = {
  submitting: false, showModal: false, editingService: null,
  deletingServiceId: null, search: '', categoryFilter: 'all',
  activeModalTab: MODAL_TAB_BASIC, selectedStaffIds: [],
};

function serviciosUIReducer(state: ServiciosUIState, action: Partial<ServiciosUIState>): ServiciosUIState {
  return { ...state, ...action };
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
      });
    } catch (e) {
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

  const filteredBySearch = data.services.filter((s) =>
    s.name.toLowerCase().includes(ui.search.toLowerCase()) ||
    getCategoryName(s).toLowerCase().includes(ui.search.toLowerCase())
  );

  const filtered = ui.categoryFilter === 'all' 
    ? filteredBySearch 
    : filteredBySearch.filter(s => s.category_id === ui.categoryFilter);

  const grouped = filtered.reduce((acc, svc) => {
    const cat = getCategoryName(svc);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {} as Record<string, Service[]>);

  function getStaffForCategory(categoryId: string): StaffMember[] {
    return data.allStaff.filter(staff => 
      getCategoryIdsFromStaffSpecialties(staff).includes(categoryId)
    );
  }

  function resetForm() {
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
    dispatchUI({ selectedStaffIds: [], activeModalTab: MODAL_TAB_BASIC });
  }

  async function openEdit(svc: Service) {
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
      newStaffIds = (svc.staff_services || []).map((ss: StaffService) => ss.staff_id);
    } else {
      const suggestedStaff = getStaffForCategory(svc.category_id);
      newStaffIds = suggestedStaff.map(s => s.id);
    }
    
    dispatchUI({ editingService: svc });
    dispatch({ type: 'SET', payload: newForm });
    initialFormRef.current = { ...newForm };
    dispatchUI({ selectedStaffIds: [...newStaffIds] });
    initialStaffIdsRef.current = [...newStaffIds];
    dispatchUI({ activeModalTab: MODAL_TAB_BASIC, showModal: true });
  }

  async function openNew() {
    dispatchUI({ editingService: null });
    resetForm();
    
    const defaultCat = data.categories.find(c => c.active) || data.categories[0];
    if (defaultCat) {
      const suggestedStaff = getStaffForCategory(defaultCat.id);
      dispatchUI({ selectedStaffIds: suggestedStaff.map(s => s.id) });
    }
    
    dispatchUI({ showModal: true });
  }

  async function handleCategoryChange(newCategoryId: string) {
    dispatch({ type: 'UPDATE', payload: { category_id: newCategoryId } });
    
    const suggestedStaff = getStaffForCategory(newCategoryId);
    dispatchUI({ selectedStaffIds: suggestedStaff.map(s => s.id) });
  }

  function toggleStaffSelection(staffId: string) {
    dispatchUI({
      selectedStaffIds: ui.selectedStaffIds.includes(staffId)
        ? ui.selectedStaffIds.filter((id: string) => id !== staffId)
        : [...ui.selectedStaffIds, staffId],
    });
  }

  function isFormValid(): boolean {
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
  }

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
    const sortedSelected = ui.selectedStaffIds.toSorted();
    const sortedInitial = initialStaffIdsRef.current.toSorted();
    if (sortedSelected.length === sortedInitial.length && !sortedSelected.every((id, i) => id === sortedInitial[i])) return true;
    
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
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
  }

  async function toggleActive(svc: Service) {
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
  }

  const categoryOptions = data.categories.flatMap(c => c.active ? [{ 
    value: c.id, 
    label: `${c.icon || ''} ${c.name}` 
  }] : []);

  return (
    <>
      <Header title="Servicios" action={
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4 mr-1" /> Nuevo
        </Button>
      } />

      <ServiceListContent
        search={ui.search}
        categoryFilter={ui.categoryFilter}
        onSearchChange={(v) => dispatchUI({ search: v })}
        onCategoryFilterChange={(v) => dispatchUI({ categoryFilter: v })}
        getFilterOptions={() => getFilterOptions(data.services, data.categories)}
        loading={data.loading}
        filtered={filtered}
        grouped={grouped}
        categories={data.categories}
        openEdit={openEdit}
      />

      <ServicioFormModal
        open={ui.showModal}
        editingService={ui.editingService}
        form={form}
        dispatch={dispatch}
        activeModalTab={ui.activeModalTab}
        onActiveModalTabChange={(v) => dispatchUI({ activeModalTab: v })}
        selectedStaffIds={ui.selectedStaffIds}
        deletingServiceId={ui.deletingServiceId}
        submitting={ui.submitting}
        allStaff={data.allStaff}
        categories={data.categories}
        categoryOptions={categoryOptions}
        onClose={() => dispatchUI({ showModal: false, editingService: null })}
        onCategoryChange={handleCategoryChange}
        onStaffToggle={toggleStaffSelection}
        onSubmit={handleSubmit}
        onDelete={async () => {
          dispatchUI({ deletingServiceId: ui.editingService!.id, showModal: false, editingService: null });
          await toggleActive(ui.editingService!);
          dispatchUI({ deletingServiceId: null });
        }}
        isFormValid={isFormValid}
        haveFormChanges={haveFormChanges}
      />
    </>
  );
}
