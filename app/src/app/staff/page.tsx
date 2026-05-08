'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  getStaff, 
  createStaff, 
  updateStaff, 
  deleteStaff, 
  getRoles, 
  getCategories, 
  updateStaffSpecialties,
  getServices,
  getCommissionOverrides,
  upsertCommissionOverride,
  deleteCommissionOverride,
} from '@/lib/db/queries';
import type { StaffMember, StaffMemberInsert, Role, Category, Service } from '@/types/database';
import { getStaffSpecialtyNames } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { Tabs } from '@/components/ui/tabs';
import { FlagPeru } from '@/components/ui/FlagPeru';
import { DatePicker } from '@/components/ui/DatePicker';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfirm } from '@/context/confirm-context';
import { 
  formatCurrency, 
  normalizePeruPhone, 
  formatPeruPhoneForInput,
  formatDate
} from '@/lib/utils';
import { 
  UserRound, 
  Plus, 
  Search, 
  Phone, 
  DollarSign, 
  Pencil, 
  Trash2, 
  Settings, 
  X, 
  Check,
  Calendar,
  Briefcase,
  TrendingUp,
  ExternalLink,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

 type StaffModalTab = 'basicos' | 'especialidades' | 'comisiones';

 function isOwnerRoleName(roleName: string | null | undefined): boolean {
   if (!roleName) return false;
   const normalized = roleName.toLowerCase().trim();
   return normalized === 'dueña' || normalized === 'founder';
 }

 function isOwnerMember(member: StaffMember | null): boolean {
   if (!member) return false;
   return isOwnerRoleName(member.role?.name);
 }

  export default function StaffPage() {
   const { confirm } = useConfirm();
   const [members, setMembers] = useState<StaffMember[]>([]);
   const [roles, setRoles] = useState<Role[]>([]);
   const [categories, setCategories] = useState<Category[]>([]);
   const [services, setServices] = useState<Service[]>([]);
   const [loading, setLoading] = useState(true);
   const [submitting, setSubmitting] = useState(false);
   const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [search, setSearch] = useState('');
  
  const [activeStaffTab, setActiveStaffTab] = useState<StaffModalTab>('basicos');
  
  const [form, setForm] = useState<StaffMemberInsert & { birthday_date: string | null }>({
    name: '', 
    phone: '', 
    role_id: '', 
    commission_pct: 0, 
    schedule: '', 
    photo_url: null, 
    active: true, 
    last_commission_paid: null,
    birthday_date: null,
  });
  
    const [specialtySelections, setSpecialtySelections] = useState<string[]>([]);
    
    const [overrides, setOverrides] = useState<Record<string, number | null>>({});
    const [showOverrides, setShowOverrides] = useState(false);
    const [overrideSearch, setOverrideSearch] = useState('');
    const [overrideDropdownOpen, setOverrideDropdownOpen] = useState(false);
    const overrideDropdownRef = useRef<HTMLDivElement>(null);

    const [initialForm, setInitialForm] = useState<any>(null);
    const [initialSpecialties, setInitialSpecialties] = useState<string[]>([]);
    const [initialOverrides, setInitialOverrides] = useState<Record<string, number | null>>({});

   useEffect(() => {
     function handleClickOutside(e: MouseEvent) {
       if (overrideDropdownRef.current && !overrideDropdownRef.current.contains(e.target as Node)) {
         setOverrideDropdownOpen(false);
       }
     }
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

  async function load() {
    try {
      const [staffData, rolesData, categoriesData, servicesData] = await Promise.all([
        getStaff(false),
        getRoles(false),
        getCategories(true),
        getServices(true),
      ]);
      setMembers(staffData as unknown as StaffMember[]);
      setRoles(rolesData as Role[]);
      setCategories(categoriesData as Category[]);
      setServices(servicesData as Service[]);
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
    if (!form.role_id) { toast.error('Selecciona un rol'); return; }
    const normalizedPhone = normalizePeruPhone(form.phone);
    const formToSave = { ...form, phone: normalizedPhone };
    
    setSubmitting(true);
     try {
       let staffId: string;
       
        if (editingMember) {
          staffId = editingMember.id;
          
          // Si es la Dueña, proteger rol y estado activo
          let formToSaveProtected = { ...formToSave };
          if (isOwnerMember(editingMember)) {
            formToSaveProtected = {
              ...formToSaveProtected,
              role_id: editingMember.role_id,
              active: true,
            };
          }
          
          await updateStaff(staffId, formToSaveProtected);
          await updateStaffSpecialties(staffId, specialtySelections);
        } else {
          // Al CREAR, siempre activo y sin rol de Dueña
          const formToCreate = { ...formToSave, active: true };
          const newMember = await createStaff(formToCreate);
          if (!newMember?.id) {
            toast.error('Error al crear miembro');
            return;
          }
          staffId = newMember.id;
          if (specialtySelections.length > 0) {
            await updateStaffSpecialties(staffId, specialtySelections);
          }
        }
     
      for (const [serviceId, fixedAmount] of Object.entries(overrides)) {
        if (fixedAmount !== null && fixedAmount >= 0) {
          await upsertCommissionOverride({
            staff_id: staffId,
            service_id: serviceId,
            founder_fixed_amount: fixedAmount,
          });
        } else {
          await deleteCommissionOverride(staffId, serviceId);
        }
      }
      
      toast.success(editingMember ? 'Miembro actualizado' : 'Miembro del staff creado');
      
      setShowModal(false);
      setEditingMember(null);
      resetStaffForm();
      load();
    } catch (e) {
      console.error(e);
      toast.error(editingMember ? 'Error al actualizar' : 'Error al crear');
    } finally {
      setSubmitting(false);
    }
  }

   function resetStaffForm() {
     const activeRoles = roles.filter(r => r.active && !isOwnerRoleName(r.name));
     setForm({ 
       name: '', 
       phone: '', 
       role_id: activeRoles[0]?.id || '', 
       commission_pct: 0, 
       schedule: '', 
       photo_url: null, 
       active: true, 
       last_commission_paid: null,
       birthday_date: null,
     });
     setSpecialtySelections([]);
     setOverrides({});
     setShowOverrides(false);
     setActiveStaffTab('basicos');
   }

    async function openEdit(member: StaffMember) {
      setEditingMember(member);
      
      const newForm = {
        name: member.name,
        phone: formatPeruPhoneForInput(member.phone),
        role_id: member.role_id,
        commission_pct: member.commission_pct,
        schedule: member.schedule || '',
        photo_url: member.photo_url,
        active: member.active,
        last_commission_paid: member.last_commission_paid,
        birthday_date: (member as any).birthday_date || null,
      };
      
      setForm(newForm);
      
      const currentSpecIds = member.staff_specialties?.map(s => s.category_id) || [];
      setSpecialtySelections(currentSpecIds);
      
      const overridesData = await getCommissionOverrides(member.id);
      const map: Record<string, number | null> = {};
      overridesData.forEach((o: any) => {
        if (o.service_id) {
          map[o.service_id] = o.founder_fixed_amount;
        }
      });
      setOverrides(map);
      
      // Guardar estado inicial para comparar cambios
      setInitialForm({ ...newForm });
      setInitialSpecialties([...currentSpecIds]);
      setInitialOverrides({ ...map });
      
      setShowOverrides(false);
      setActiveStaffTab('basicos');
      
      setShowModal(true);
    }

    function openNew() {
      setEditingMember(null);
      resetStaffForm();
      
      // Guardar estado inicial para nuevo miembro
      const activeRoles = roles.filter(r => r.active && !isOwnerRoleName(r.name));
      const defaultForm = { 
        name: '', 
        phone: '', 
        role_id: activeRoles[0]?.id || '', 
        commission_pct: 0, 
        schedule: '', 
        photo_url: null, 
        active: true, 
        last_commission_paid: null,
        birthday_date: null,
      };
      setInitialForm({ ...defaultForm });
      setInitialSpecialties([]);
      setInitialOverrides({});
      
      setShowModal(true);
    }

   async function handleDelete(member: StaffMember) {
     if (isOwnerMember(member)) {
       toast.error('No se puede eliminar a la Dueña');
       return;
     }
     if (deletingId) return;
     
     const confirmed = await confirm({
       title: 'Eliminar miembro',
       message: `¿Eliminar a ${member.name}? Esta acción no se puede deshacer.`,
       confirmText: 'Eliminar',
       cancelText: 'Cancelar',
       variant: 'danger',
     });
     
     if (!confirmed) return;
     
     setDeletingId(member.id);
     try {
       await deleteStaff(member.id);
       toast.success('Staff eliminado');
       load();
     } catch (e) {
       toast.error('Error al eliminar');
     } finally {
       setDeletingId(null);
     }
   }

  const filtered = members.filter((m) => {
    const s = search.toLowerCase();
    return m.name.toLowerCase().includes(s) ||
      (m.phone || '').includes(s) ||
      m.role?.name.toLowerCase().includes(s);
  });

  const staffTabs = [
    { 
      id: 'basicos' as StaffModalTab, 
      label: 'Datos Básicos', 
      icon: <UserRound className="w-4 h-4" /> 
    },
    { 
      id: 'especialidades' as StaffModalTab, 
      label: 'Especialidades', 
      icon: <Briefcase className="w-4 h-4" /> 
    },
    { 
      id: 'comisiones' as StaffModalTab, 
      label: 'Comisiones', 
      icon: <DollarSign className="w-4 h-4" /> 
    },
  ];

   return (
     <>
       <Header title="Staff / Artists" action={
         <Button size="sm" onClick={openNew}>
           <Plus className="w-4 h-4 mr-1" /> Nuevo
         </Button>
       } />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o rol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
          />
        </div>

             {loading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {[1, 2, 3, 4, 5, 6].map((i) => (
                   <Card key={i}>
                     <CardContent className="py-5">
                       <div className="flex items-start gap-4">
                         <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                         <div className="flex-1 space-y-2">
                           <Skeleton className="h-5 w-3/4" />
                           <Skeleton className="h-4 w-1/2" />
                         </div>
                       </div>
                       <div className="flex flex-wrap gap-1 mt-3">
                         <Skeleton className="h-5 w-20" />
                         <Skeleton className="h-5 w-16" />
                       </div>
                       <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                         <Skeleton className="h-4 w-24" />
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-400">
                  <UserRound className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay miembros del staff {search ? 'que coincidan' : 'registrados'}</p>
                </CardContent>
              </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((member) => {
                    const isOwner = isOwnerMember(member);
                    return (
                     <Card 
                       key={member.id} 
                       onClick={() => openEdit(member)}
                       className={`relative cursor-pointer transition-all hover:shadow-md ${!member.active ? 'opacity-60' : ''} ${isOwner ? 'ring-2 ring-amber-200' : ''}`}
                     >
                      <CardContent className="py-5">
                       <div className="flex items-start gap-4">
                         <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-bold text-lg flex-shrink-0">
                           {member.name[0].toUpperCase()}
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="font-semibold">{member.name}</p>
                          <Badge variant="custom" color={member.role?.color || '#6B7280'} className="mt-1">{member.role?.name || 'Sin rol'}</Badge>
                          {member.phone && (
                            <p className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                              <Phone className="w-3 h-3" />{member.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {member.staff_specialties && member.staff_specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {member.staff_specialties.map((spec, i) => (
                            <Badge key={i} variant="custom" color={spec.category?.color || '#6B7280'} className="text-[10px]">
                              {spec.category?.icon || ''} {spec.category?.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {member.staff_stats && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                          <span>{member.staff_stats.total_appointments} citas</span>
                          <span>{formatCurrency(member.staff_stats.total_revenue)}</span>
                        </div>
                      )}

                       <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                         <span className="text-xs text-gray-400">Comisión: <span className="font-semibold text-gray-700">{member.commission_pct}%</span></span>
                         {!member.active && <Badge variant="danger">Inactivo</Badge>}
                       </div>
                     </CardContent>
                   </Card>
                  );
                })}
              </div>
             )}
       </div>

       {/* Staff Modal with Tabs */}
        <Modal 
         open={showModal} 
         onClose={() => { 
           setShowModal(false); 
           setEditingMember(null);
           resetStaffForm();
         }} 
         title={editingMember ? 'Editar Miembro' : 'Nuevo Miembro del Staff'}
       >
          <div className="space-y-4">
            {/* Toggle de Activo/Inactivo: SOLO al editar y NO es Founder */}
            {editingMember && !isOwnerMember(editingMember) && (
              <div className="flex items-center justify-between p-3 rounded-xl border bg-gray-50 border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${form.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {form.active ? 'Activo' : 'Inactivo'}
                  </span>
                  {!form.active && (
                    <span className="text-xs text-gray-400">
                      (No aparecerá para asignar citas)
                    </span>
                  )}
                </div>
                
                {/* Toggle Switch Moderno */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className="relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-salon-500 focus:ring-offset-2"
                  style={{
                    backgroundColor: form.active ? '#22c55e' : '#d1d5db'
                  }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    style={{
                      left: form.active ? '1.75rem' : '0.25rem'
                    }}
                  />
                </button>
              </div>
            )}

           <Tabs 
             tabs={staffTabs} 
             active={activeStaffTab} 
             onChange={(id) => setActiveStaffTab(id as StaffModalTab)} 
           />

           <form onSubmit={handleSubmit}>
             {/* Pestaña 1: Datos Básicos */}
             {activeStaffTab === 'basicos' && (
               <div className="space-y-4 pt-2">
                   <div className="space-y-1">
                     <label className="block text-sm font-medium text-gray-700">
                       Nombre <span className="text-red-500">*</span>
                     </label>
                     <Input 
                       value={form.name} 
                       onChange={(e) => setForm({ ...form, name: e.target.value })} 
                       placeholder="Nombre completo" 
                       disabled={isOwnerMember(editingMember)}
                     />
                   </div>

                 <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <Input 
                      leftPrefix={<FlagPeru className="w-5 h-5" />}
                      value={form.phone || ''} 
                      onChange={(e) => setForm({ ...form, phone: formatPeruPhoneForInput(e.target.value) })} 
                      placeholder="987 654 321" 
                      maxLength={11} 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Rol <span className="text-red-500">*</span>
                    </label>
                     <Select 
                        value={form.role_id} 
                        onChange={(value) => setForm({ ...form, role_id: value })} 
                        disabled={isOwnerMember(editingMember)}
                        options={
                          roles
                            .filter(r => r.active)
                            .filter(r => {
                              if (isOwnerMember(editingMember)) {
                                return true;
                              }
                              return !isOwnerRoleName(r.name);
                            })
                            .map(r => ({ value: r.id, label: r.name }))
                        }
                      />
                     {isOwnerMember(editingMember) && (
                       <p className="text-xs text-gray-500 mt-1">
                         El rol de Dueña no se puede cambiar.
                       </p>
                     )}
                  </div>

                  <DatePicker
                     label="Fecha de Cumpleaños"
                     value={form.birthday_date}
                     onChange={(val) => setForm({ ...form, birthday_date: val })}
                     placeholder="Seleccionar fecha de cumpleaños"
                   />
               </div>
             )}

             {/* Pestaña 2: Especialidades & Horario */}
             {activeStaffTab === 'especialidades' && (
               <div className="space-y-4 pt-2">
                 <div className="space-y-2">
                   <label className="block text-sm font-medium text-gray-700">Especialidades</label>
                   <p className="text-xs text-gray-500">
                     ¿Qué categorías de servicios maneja esta persona?
                   </p>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {categories.filter(c => c.active).map((cat) => (
                        <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                          <Checkbox
                            checked={specialtySelections.includes(cat.id)}
                            onChange={(checked) => {
                              setSpecialtySelections(
                                checked 
                                  ? [...specialtySelections, cat.id] 
                                  : specialtySelections.filter(s => s !== cat.id)
                              );
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{cat.icon || '📋'}</span>
                            <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                            {cat.description && (
                              <span className="text-xs text-gray-400">
                                — {cat.description}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div className="space-y-1">
                   <label className="block text-sm font-medium text-gray-700">
                     <Clock className="w-4 h-4 inline mr-1" />
                     Horario
                   </label>
                   <Textarea 
                     value={form.schedule || ''}
                     onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                     placeholder="Ej: Lun-Sáb 9:00-18:00"
                   />
                   <p className="text-xs text-gray-400 mt-1">
                     Opcional: para saber cuándo trabaja
                   </p>
                 </div>
               </div>
             )}

             {/* Pestaña 3: Comisiones */}
             {activeStaffTab === 'comisiones' && (
               <div className="space-y-4 pt-2">
                 {isOwnerMember(editingMember) ? (
                   <>
                     <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-500" />
                         <span className="text-sm font-semibold text-emerald-800">
                           Founder / Dueña
                         </span>
                       </div>
                       <p className="text-xs text-emerald-700">
                         La Founder recibe el <strong>100%</strong> de todas las comisiones. Este valor no es modificable.
                       </p>
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="space-y-2">
                       <label className="block text-sm font-medium text-gray-700">
                         <DollarSign className="w-4 h-4 inline mr-1" />
                         Comisión General (%)
                       </label>
                       <Input 
                         type="number" 
                         value={form.commission_pct}
                         onChange={(e) => setForm({ ...form, commission_pct: parseFloat(e.target.value) || 0 })}
                         placeholder="Ej: 70"
                       />
                       <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1">
                         <p className="text-sm text-gray-700">
                           Ejemplo rápido:
                         </p>
                         <p className="text-xs text-gray-500">
                           Si un servicio cuesta <strong>S/ 100.00</strong> y la comisión es <strong>{form.commission_pct}%</strong>:
                         </p>
                          <div className="flex gap-4 text-xs mt-2">
                            <span className="text-accent-600">
                              ✓ Artista recibe: <strong>{formatCurrency(Math.round(100 * (form.commission_pct || 0)) / 100)}</strong>
                            </span>
                            <span className="text-emerald-600">
                              ✓ Founder recibe: <strong>{formatCurrency(100 - Math.round(100 * (form.commission_pct || 0)) / 100)}</strong>
                            </span>
                          </div>
                       </div>
                     </div>

                     <div className="border-t border-gray-100 pt-4">
                       <div className="flex items-center justify-between mb-2">
                         <p className="text-sm font-medium text-gray-700">
                           Excepciones por servicio
                         </p>
                         {Object.keys(overrides).length > 0 && (
                           <span className="text-xs text-gray-500">
                             {Object.keys(overrides).length} excepcion(es)
                           </span>
                         )}
                       </div>

                       <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                         <p className="text-xs text-amber-700">
                           Para servicios especiales, define un <strong>MONTO FIJO</strong> que recibe la Founder en lugar del porcentaje.
                         </p>
                         <p className="text-xs text-amber-600 mt-1">
                            Ejemplo: Pedicura (S/ 50) → Founder recibe S/ 5 fijo → Artista recibe S/ 45.
                         </p>
                       </div>

                       {/* Buscar y agregar servicio */}
                        <div ref={overrideDropdownRef} className="relative mb-4">
                         <div className="flex items-center gap-2">
                           <div className="flex-1 relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                             <input
                               type="text"
                               value={overrideSearch}
                               onChange={(e) => {
                                 setOverrideSearch(e.target.value);
                                 setOverrideDropdownOpen(true);
                               }}
                               onFocus={() => setOverrideDropdownOpen(true)}
                               placeholder="Buscar servicio para agregar excepción..."
                               className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent"
                             />
                           </div>
                         </div>

                         {/* Dropdown de resultados */}
                         {overrideDropdownOpen && (
                           <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-y-auto">
                             {(() => {
                               const searchLower = overrideSearch.toLowerCase();
                               const filtered = services.filter(
                                 (svc) => 
                                   svc.name.toLowerCase().includes(searchLower) &&
                                   !overrides[svc.id]
                               );

                               if (overrideSearch.trim() && filtered.length === 0) {
                                 return (
                                   <div className="p-4 text-center">
                                     <p className="text-sm text-gray-400">No hay servicios que coincidan</p>
                                   </div>
                                 );
                               }

                               if (filtered.length === 0) {
                                 return (
                                   <div className="p-4 text-center">
                                     <p className="text-sm text-gray-400">
                                       {services.length - Object.keys(overrides).length} servicio(s) disponibles
                                     </p>
                                   </div>
                                 );
                               }

                               return filtered.slice(0, 10).map((svc) => (
                                 <button
                                   key={svc.id}
                                   type="button"
                                   onClick={() => {
                                     setOverrides({ ...overrides, [svc.id]: 0 });
                                     setOverrideSearch('');
                                     setOverrideDropdownOpen(false);
                                   }}
                                   className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
                                 >
                                   <div>
                                     <p className="text-sm font-medium text-gray-900">{svc.name}</p>
                                     <p className="text-xs text-gray-500">
                                       Precio: {formatCurrency(svc.price)}
                                       {svc.category && (
                                         <span className="ml-2">
                                           • {svc.category.name}
                                         </span>
                                       )}
                                     </p>
                                   </div>
                                   <Plus className="w-4 h-4 text-gray-400" />
                                 </button>
                               ));
                             })()}
                           </div>
                         )}
                       </div>

                        {/* Lista de excepciones configuradas */}
                        {Object.keys(overrides).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(overrides).map(([serviceId, fixedAmount]) => {
                              const svc = services.find((s) => s.id === serviceId);
                              if (!svc) return null;

                              return (
                                <div 
                                  key={serviceId}
                                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border bg-emerald-50 border-emerald-200"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{svc.name}</p>
                                    <p className="text-xs text-gray-500">
                                      Precio: {formatCurrency(svc.price)}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between sm:justify-end gap-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <span className="text-xs text-emerald-700 font-medium hidden sm:inline">Founder:</span>
                                      <Input
                                        className="w-20 sm:w-24 text-center text-sm"
                                        type="number"
                                        placeholder="0"
                                        value={fixedAmount ?? ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setOverrides({
                                            ...overrides,
                                            [serviceId]: val === '' ? null : parseFloat(val)
                                          });
                                        }}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newOverrides = { ...overrides };
                                        delete newOverrides[serviceId];
                                        setOverrides(newOverrides);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                                      title="Quitar excepción"
                                    >
                                      <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                            <p className="text-sm text-gray-400">No hay excepciones configuradas</p>
                            <p className="text-xs text-gray-400 mt-1">Usa el buscador de arriba para agregar</p>
                          </div>
                        )}
                     </div>
                   </>
                 )}

                 {/* Historial: SOLO al editar */}
                 {editingMember && (
                   <div className="border-t border-gray-100 pt-4">
                     <div className="flex items-center justify-between mb-2">
                       <p className="text-sm font-medium text-gray-700">
                         <TrendingUp className="w-4 h-4 inline mr-1" />
                         Resumen
                       </p>
                       <button
                         type="button"
                         onClick={() => window.location.href = '/reportes/comisiones'}
                         className="text-xs text-salon-600 hover:text-salon-700 font-medium flex items-center gap-1"
                       >
                         Ver reporte completo
                         <ExternalLink className="w-3 h-3" />
                       </button>
                     </div>

                     <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                       {editingMember.staff_stats ? (
                         <>
                           <div className="grid grid-cols-3 gap-4 text-center">
                             <div>
                               <p className="text-xs text-gray-500">Citas</p>
                               <p className="font-semibold text-gray-900">{editingMember.staff_stats.total_appointments}</p>
                             </div>
                             <div>
                               <p className="text-xs text-gray-500">Ingreso</p>
                               <p className="font-semibold text-gray-900">
                                 {formatCurrency(editingMember.staff_stats.total_revenue)}
                               </p>
                             </div>
                             <div>
                               <p className="text-xs text-gray-500">Comisión %</p>
                               <p className="font-semibold text-accent-600">
                                 {editingMember.commission_pct}%
                               </p>
                             </div>
                           </div>
                           {editingMember.last_commission_paid && (
                             <div className="pt-3 border-t border-gray-200">
                               <p className="text-xs text-gray-500">
                                 Última comisión pagada: <strong>{formatDate(editingMember.last_commission_paid)}</strong>
                               </p>
                             </div>
                           )}
                         </>
                       ) : (
                         <p className="text-xs text-gray-400 text-center">
                           Aún no hay datos históricos para este miembro.
                         </p>
                       )}
                     </div>
                   </div>
                 )}
               </div>
             )}

              {/* Botones de acción */}
               {(() => {
                 // Función para comparar arrays de strings
                 const arraysEqual = (a: string[], b: string[]) => {
                   if (a.length !== b.length) return false;
                   return a.every((item, index) => item === b[index]);
                 };

                 // Función para comparar records de overrides
                 const recordsEqual = (a: Record<string, number | null>, b: Record<string, number | null>) => {
                   const keysA = Object.keys(a);
                   const keysB = Object.keys(b);
                   if (keysA.length !== keysB.length) return false;
                   return keysA.every((key) => a[key] === b[key]);
                 };

                 // Comparar estado actual vs inicial
                 const isEditing = !!editingMember;
                 const formChanged = JSON.stringify(form) !== JSON.stringify(initialForm);
                 const specialtiesChanged = !arraysEqual(specialtySelections, initialSpecialties);
                 const overridesChanged = !recordsEqual(overrides, initialOverrides);
                 
                 const hasChanges = !isEditing || formChanged || specialtiesChanged || overridesChanged;

                 return (
                   <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 mt-2 border-t border-gray-100">
                     {/* Eliminar: último en mobile, primero en sm+ */}
                      {editingMember && !isOwnerMember(editingMember) && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 order-last sm:order-none"
                          loading={deletingId === editingMember.id}
                          onClick={async () => {
                            if (editingMember) {
                              setShowModal(false);
                              setEditingMember(null);
                              resetStaffForm();
                              await handleDelete(editingMember);
                            }
                          }}
                        >
                          {deletingId !== editingMember.id && <Trash2 className="w-4 h-4 mr-1" />}
                          {deletingId === editingMember.id ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                      )}
                     
                     {/* Espacio vacío entre izquierda y derecha (solo sm+) */}
                     <div className="hidden sm:block flex-1" />
                     
                     {/* Cancelar + Actualizar: primero en mobile, después del espacio en sm+ */}
                     <div className="flex flex-1 sm:flex-none gap-2 order-first sm:order-none">
                       <Button
                         type="button"
                         variant="outline"
                         className="flex-1"
                         onClick={() => { 
                           setShowModal(false); 
                           setEditingMember(null);
                           resetStaffForm();
                         }}
                       >
                         Cancelar
                       </Button>
                        <Button 
                          type="submit" 
                          className="flex-1"
                          disabled={!hasChanges}
                          loading={submitting}
                        >
                          {!submitting && <Check className="w-4 h-4 mr-1" />}
                          {submitting ? 'Guardando...' : (editingMember ? 'Actualizar' : 'Crear')}
                        </Button>
                     </div>
                   </div>
                 );
               })()}
           </form>
         </div>
        </Modal>
    </>
  );
}
