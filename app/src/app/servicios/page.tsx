'use client';

import { useEffect, useState } from 'react';
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

export default function ServiciosPage() {
  const { confirm } = useConfirm();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
   const [showModal, setShowModal] = useState(false);
   const [editingService, setEditingService] = useState<Service | null>(null);
   const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeModalTab, setActiveModalTab] = useState(MODAL_TAB_BASIC);
  
   const [form, setForm] = useState<ServiceForm>({
     name: '', 
     category_id: '', 
     duration_min: 30, 
     price: 0, 
     price_type: 'fixed',
     price_from: null,
     price_to: null,
     description: '', 
     image_url: null, 
     active: true,
   });
   
   const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
   const [initialForm, setInitialForm] = useState<ServiceForm | null>(null);
   const [initialStaffIds, setInitialStaffIds] = useState<string[]>([]);

  async function load() {
    try {
      const [servicesData, categoriesData, staffData] = await Promise.all([
        getServices(true),
        getCategories(true),
        getStaff(true),
      ]);
      setServices(servicesData as Service[]);
      setCategories(categoriesData as Category[]);
      setAllStaff(staffData as StaffMember[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filteredBySearch = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    getCategoryName(s).toLowerCase().includes(search.toLowerCase())
  );

  const filtered = categoryFilter === 'all' 
    ? filteredBySearch 
    : filteredBySearch.filter(s => s.category_id === categoryFilter);

  const grouped = filtered.reduce((acc, svc) => {
    const cat = getCategoryName(svc);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {} as Record<string, Service[]>);

  function getStaffForCategory(categoryId: string): StaffMember[] {
    return allStaff.filter(staff => 
      getCategoryIdsFromStaffSpecialties(staff).includes(categoryId)
    );
  }

  function resetForm() {
    const defaultCat = categories.find(c => c.active) || categories[0];
    setForm({ 
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
    });
    setSelectedStaffIds([]);
    setActiveModalTab(MODAL_TAB_BASIC);
  }

   async function openEdit(svc: Service) {
     // Calcular valores primero
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
     
     // Setear estados actuales e iniciales
     setEditingService(svc);
     setForm(newForm);
     setInitialForm({ ...newForm });
     setSelectedStaffIds([...newStaffIds]);
     setInitialStaffIds([...newStaffIds]);
     setActiveModalTab(MODAL_TAB_BASIC);
     setShowModal(true);
   }

  async function openNew() {
    setEditingService(null);
    resetForm();
    
    const defaultCat = categories.find(c => c.active) || categories[0];
    if (defaultCat) {
      const suggestedStaff = getStaffForCategory(defaultCat.id);
      setSelectedStaffIds(suggestedStaff.map(s => s.id));
    }
    
    setShowModal(true);
  }

  async function handleCategoryChange(newCategoryId: string) {
    setForm({ ...form, category_id: newCategoryId });
    
    const suggestedStaff = getStaffForCategory(newCategoryId);
    setSelectedStaffIds(suggestedStaff.map(s => s.id));
  }

  function toggleStaffSelection(staffId: string) {
    setSelectedStaffIds(prev => 
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
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
     if (!editingService || !initialForm) return true;
     
     if (form.name !== initialForm.name) return true;
     if (form.category_id !== initialForm.category_id) return true;
     if (form.duration_min !== initialForm.duration_min) return true;
     if (form.price_type !== initialForm.price_type) return true;
     if (form.price !== initialForm.price) return true;
     if (form.price_from !== initialForm.price_from) return true;
     if (form.price_to !== initialForm.price_to) return true;
     if (form.description !== initialForm.description) return true;
     if (form.image_url !== initialForm.image_url) return true;
     if (form.active !== initialForm.active) return true;
     
     if (selectedStaffIds.length !== initialStaffIds.length) return true;
     const sortedSelected = [...selectedStaffIds].sort();
     const sortedInitial = [...initialStaffIds].sort();
     if (!sortedSelected.every((id, i) => id === sortedInitial[i])) return true;
     
     return false;
   }

   async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!isFormValid()) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    
    setSubmitting(true);
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
      
      if (editingService) {
        await updateService(editingService.id, serviceData);
        savedServiceId = editingService.id;
        toast.success('Servicio actualizado');
      } else {
        const newService = await createService(serviceData);
        savedServiceId = newService.id;
        toast.success('Servicio creado');
      }

       await updateStaffServices(savedServiceId, selectedStaffIds);

      setShowModal(false);
      setEditingService(null);
      resetForm();
      load();
    } catch (e) {
      toast.error(editingService ? 'Error al actualizar' : 'Error al crear');
    } finally {
      setSubmitting(false);
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

  function getFilterOptions() {
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

  const categoryOptions = categories.filter(c => c.active).map(c => ({ 
    value: c.id, 
    label: `${c.icon || ''} ${c.name}` 
  }));



  return (
    <>
      <Header title="Servicios" action={
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      } />

       <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
         <div className="flex flex-col sm:flex-row gap-3">
           {/* Buscador (izquierda - flex-1 */}
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
             <input
               type="text"
               placeholder="Buscar servicio..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
             />
           </div>
           {/* Filtro (derecha - w-full en mobile, w-48 en desktop */}
           <div className="w-full sm:w-48 sm:flex-shrink-0">
             <Select 
               value={categoryFilter} 
               onChange={setCategoryFilter} 
               options={getFilterOptions()}
               placeholder="Categoría"
             />
           </div>
         </div>

         <div className="flex items-center gap-4 text-sm text-gray-500">
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
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <Palette className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay servicios {search || categoryFilter !== 'all' ? 'que coincidan' : 'registrados'}</p>
            </CardContent>
          </Card>
        ) : categoryFilter === 'all' ? (
          Object.entries(grouped).map(([category, svcs]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Badge variant="custom" color={svcs[0]?.category?.color || '#6B7280'}>{category}</Badge>
                <span className="text-xs text-gray-400">({svcs.length})</span>
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

      <Modal 
        open={showModal} 
        onClose={() => { setShowModal(false); setEditingService(null); }} 
        title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs
            tabs={[
              { id: MODAL_TAB_BASIC, label: 'Datos Básicos', icon: <Palette className="w-4 h-4" /> },
              { id: MODAL_TAB_STAFF, label: 'Staff', icon: <Users className="w-4 h-4" /> },
            ]}
            active={activeModalTab}
            onChange={setActiveModalTab}
          />

          {activeModalTab === MODAL_TAB_BASIC && (
            <div className="space-y-4 pt-2">
              <Input 
                label="Nombre *" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="Ej: Manicure semipermanente" 
              />
              
              <Select 
                label="Categoría *" 
                value={form.category_id} 
                onChange={handleCategoryChange} 
                options={categoryOptions} 
              />
              
               <Input 
                 label="Duración (min) *" 
                 type="number" 
                 value={form.duration_min} 
                 onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) || 0 })} 
               />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Precio</label>
                  
                  {form.price_type === 'fixed' ? (
                    <div className="flex gap-2 items-start">
                      <div className="w-36 flex-shrink-0">
                        <Select
                          value={form.price_type}
                          onChange={(value) => setForm({ ...form, price_type: value as PriceType })}
                          options={[
                            { value: 'fixed', label: 'Fijo' },
                            { value: 'variable', label: 'Variable' },
                          ]}
                        />
                      </div>
                      <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                          <span className="text-gray-400 text-sm font-medium select-none">S/</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={form.price || ''}
                          onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent placeholder:text-gray-300"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Mobile */}
                      <div className="flex flex-col gap-2 items-start sm:hidden">
                        <div className="w-full">
                          <Select
                            value={form.price_type}
                            onChange={(value) => setForm({ ...form, price_type: value as PriceType })}
                            options={[
                              { value: 'fixed', label: 'Fijo' },
                              { value: 'variable', label: 'Variable' },
                            ]}
                          />
                        </div>
                        <div className="w-full flex gap-2">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                              <span className="text-gray-400 text-sm font-medium select-none">S/</span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={form.price_from ?? ''}
                              onChange={(e) => setForm({ ...form, price_from: e.target.value ? parseFloat(e.target.value) : null })}
                              placeholder="Desde"
                              className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent placeholder:text-gray-300"
                            />
                          </div>
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                              <span className="text-gray-400 text-sm font-medium select-none">S/</span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={form.price_to ?? ''}
                              onChange={(e) => setForm({ ...form, price_to: e.target.value ? parseFloat(e.target.value) : null })}
                              placeholder="Hasta"
                              className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Desktop */}
                      <div className="hidden sm:flex gap-2 items-start">
                        <div className="w-36 flex-shrink-0">
                          <Select
                            value={form.price_type}
                            onChange={(value) => setForm({ ...form, price_type: value as PriceType })}
                            options={[
                              { value: 'fixed', label: 'Fijo' },
                              { value: 'variable', label: 'Variable' },
                            ]}
                          />
                        </div>
                        <div className="flex-1 flex gap-2">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                              <span className="text-gray-400 text-sm font-medium select-none">S/</span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={form.price_from ?? ''}
                              onChange={(e) => setForm({ ...form, price_from: e.target.value ? parseFloat(e.target.value) : null })}
                              placeholder="Desde"
                              className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent placeholder:text-gray-300"
                            />
                          </div>
                          <div className="flex items-center justify-center px-1">
                            <span className="text-gray-400 text-lg font-light">—</span>
                          </div>
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                              <span className="text-gray-400 text-sm font-medium select-none">S/</span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={form.price_to ?? ''}
                              onChange={(e) => setForm({ ...form, price_to: e.target.value ? parseFloat(e.target.value) : null })}
                              placeholder="Hasta"
                              className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent placeholder:text-gray-300"
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
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                placeholder="Descripción del servicio..." 
              />
            </div>
          )}

           {activeModalTab === MODAL_TAB_STAFF && (
             <div className="space-y-4 pt-2">
               <div className="space-y-1">
                 <label className="text-sm font-medium text-gray-700">
                   Artistas que brindan este servicio
                 </label>
                 <p className="text-xs text-gray-400">
                   Pre-seleccionados según la categoría. Puedes marcar/desmarcar cualquiera.
                 </p>
               </div>
                 
               {allStaff.length === 0 ? (
                 <p className="text-sm text-gray-400 text-center py-4">No hay staff registrado</p>
               ) : (
                 <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                   {allStaff.map((staff) => {
                     const hasSpecialty = getCategoryIdsFromStaffSpecialties(staff).includes(form.category_id);
                     const isSelected = selectedStaffIds.includes(staff.id);
                     
                     return (
                       <div 
                         key={staff.id}
                         onClick={() => toggleStaffSelection(staff.id)}
                         className={`p-3 rounded-xl border transition-all cursor-pointer ${
                           isSelected
                             ? 'border-salon-400 bg-salon-50'
                             : 'border-gray-200 hover:border-gray-300'
                         }`}
                       >
                         <div className="flex items-center gap-3">
                           <Checkbox
                             checked={isSelected}
                             onChange={() => toggleStaffSelection(staff.id)}
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
                             <p className="text-xs text-gray-400 mt-0.5">
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
           )}

           <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 mt-2 border-t border-gray-100">
             {editingService && (
               <Button
                 type="button"
                 variant="outline"
                 className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 order-last sm:order-none"
                 loading={deletingServiceId === editingService.id}
                 onClick={async () => {
                   setDeletingServiceId(editingService.id);
                   setShowModal(false);
                   setEditingService(null);
                   await toggleActive(editingService);
                   setDeletingServiceId(null);
                 }}
               >
                 {deletingServiceId !== editingService.id && <Trash2 className="w-4 h-4 mr-1" />}
                 {deletingServiceId === editingService.id ? 'Eliminando...' : 'Eliminar'}
               </Button>
             )}
             
             <div className="hidden sm:block flex-1" />
             
             <div className="flex flex-1 sm:flex-none gap-2 order-first sm:order-none">
               <Button
                 type="button"
                 variant="outline"
                 className="flex-1"
                 onClick={() => { setShowModal(false); setEditingService(null); }}
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
    </>
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
                  <Users className="w-3 h-3 mr-1" />
                  {service.staff_services?.length || 0}
                </Badge>
              )}
            </div>
            {service.description && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{service.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
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
