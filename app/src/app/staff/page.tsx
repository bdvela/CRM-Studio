'use client';

import { useEffect, useState } from 'react';
import { 
  getStaff, 
  createStaff, 
  updateStaff, 
  deleteStaff, 
  getRoles, 
  createRole, 
  updateRole, 
  deleteRole, 
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
  Layers, 
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
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff');
  
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
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
  const [roleForm, setRoleForm] = useState({ name: '', description: '', color: '#6B7280' });
  
  const [overrides, setOverrides] = useState<Record<string, number | null>>({});
  const [showOverrides, setShowOverrides] = useState(false);

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

  useEffect(() => { load(); }, [activeTab]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!form.role_id) { toast.error('Selecciona un rol'); return; }
    const normalizedPhone = normalizePeruPhone(form.phone);
    const formToSave = { ...form, phone: normalizedPhone };
    
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
     setForm({
       name: member.name,
       phone: formatPeruPhoneForInput(member.phone),
       role_id: member.role_id,
       commission_pct: member.commission_pct,
       schedule: member.schedule || '',
       photo_url: member.photo_url,
       active: member.active,
       last_commission_paid: member.last_commission_paid,
       birthday_date: (member as any).birthday_date || null,
     });
     
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
     setShowOverrides(false);
     setActiveStaffTab('basicos');
     
     setShowModal(true);
   }

   function openNew() {
     setEditingMember(null);
     resetStaffForm();
     setShowModal(true);
   }

   async function handleDelete(member: StaffMember) {
     if (isOwnerMember(member)) {
       toast.error('No se puede eliminar a la Dueña');
       return;
     }
     if (!confirm(`¿Eliminar a ${member.name}? Esta acción no se puede deshacer.`)) return;
     try {
       await deleteStaff(member.id);
       toast.success('Staff eliminado');
       load();
     } catch (e) {
       toast.error('Error al eliminar');
     }
   }

  async function handleRoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roleForm.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    try {
      if (editingRole) {
        await updateRole(editingRole.id, roleForm);
        toast.success('Rol actualizado');
      } else {
        await createRole(roleForm);
        toast.success('Rol creado');
      }
      setShowRoleModal(false);
      setEditingRole(null);
      setRoleForm({ name: '', description: '', color: '#6B7280' });
      load();
    } catch (e: any) {
      toast.error(e.message || 'Error');
    }
  }

  function openRoleEdit(role: Role) {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description || '', color: role.color });
    setShowRoleModal(true);
  }

  function openRoleNew() {
    setEditingRole(null);
    setRoleForm({ name: '', description: '', color: '#6B7280' });
    setShowRoleModal(true);
  }

  async function handleDeleteRole(role: Role) {
    if (!confirm(`¿Eliminar el rol "${role.name}"? No se puede si hay staff asignado.`)) return;
    try {
      await deleteRole(role.id);
      toast.success('Rol eliminado');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar');
    }
  }

  async function toggleRoleActive(role: Role) {
    try {
      await updateRole(role.id, { active: !role.active });
      toast.success(`Rol ${role.active ? 'desactivado' : 'activado'}`);
      load();
    } catch (e) {
      toast.error('Error al actualizar');
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
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'staff' ? 'bg-salon-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <UserRound className="w-4 h-4 inline mr-1" /> Equipo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'roles' ? 'bg-salon-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Layers className="w-4 h-4 inline mr-1" /> Roles
            </button>
          </div>
          {activeTab === 'staff' ? (
            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo
            </Button>
          ) : (
            <Button size="sm" onClick={openRoleNew}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo Rol
            </Button>
          )}
        </div>
      } />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
        {activeTab === 'staff' ? (
          <>
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
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
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
                       {isOwner && (
                         <div className="absolute top-3 right-3 z-10">
                           <div className="px-2 py-1 bg-amber-50 rounded-lg">
                             <span className="text-[10px] font-medium text-amber-600">Protegido</span>
                           </div>
                         </div>
                       )}
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
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCurrency(member.staff_stats.total_revenue)}</span>
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
          </>
        ) : (
          <>
            {roles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-400">
                  <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay roles creados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <Card key={role.id} className={!role.active ? 'opacity-60' : ''}>
                    <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                      <button type="button" onClick={() => toggleRoleActive(role)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title={role.active ? 'Desactivar' : 'Activar'}>
                        {role.active ? <span className="text-xs font-medium text-green-600">✓</span> : <span className="text-xs font-medium text-gray-400">✗</span>}
                      </button>
                      <button type="button" onClick={() => openRoleEdit(role)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                      </button>
                      <button type="button" onClick={() => handleDeleteRole(role)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                    <CardContent className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: role.color + '20' }}>
                          <div className="w-full h-full rounded-full flex items-center justify-center text-sm font-bold" style={{ color: role.color }}>{role.name[0]}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{role.name}</p>
                          {role.description && <p className="text-xs text-gray-400 truncate">{role.description}</p>}
                        </div>
                      </div>
                      {!role.active && <div className="mt-3 pt-3 border-t border-gray-100"><Badge variant="danger">Desactivado</Badge></div>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
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
                       onChange={(e) => setForm({ ...form, role_id: e.target.value })} 
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
                       <label key={cat.id} className="flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                         <input 
                           type="checkbox" 
                           checked={specialtySelections.includes(cat.id)}
                           onChange={(e) => {
                             setSpecialtySelections(
                               e.target.checked 
                                 ? [...specialtySelections, cat.id] 
                                 : specialtySelections.filter(s => s !== cat.id)
                             );
                           }}
                           className="rounded border-gray-300 text-salon-600 focus:ring-salon-500"
                         />
                         <span className="text-sm flex items-center gap-2">
                           <span className="text-lg">{cat.icon || '📋'}</span>
                           <span className="font-medium">{cat.name}</span>
                           {cat.description && (
                             <span className="text-xs text-gray-400">
                               — {cat.description}
                             </span>
                           )}
                         </span>
                       </label>
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
                       <button
                         type="button"
                         onClick={() => setShowOverrides(!showOverrides)}
                         className="text-sm text-salon-600 hover:text-salon-700 font-medium flex items-center gap-1.5"
                       >
                         <Settings className="w-4 h-4" />
                         {showOverrides ? 'Ocultar excepciones' : 'Configurar excepciones por servicio'}
                       </button>

                       {showOverrides && (
                         <div className="mt-3 space-y-2">
                           <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                             <p className="text-sm font-medium text-amber-800">
                               <strong>¿Qué son las excepciones?</strong>
                             </p>
                             <p className="text-xs text-amber-700 mt-1">
                               Para servicios especiales (ej: pedicura, cejas), puedes definir un <strong>MONTO FIJO</strong> que recibe la Founder en lugar del porcentaje.
                             </p>
                             <p className="text-xs text-amber-700 mt-1">
                               Ejemplo: Pedicura ($50) → Founder recibe $5 fijo → Artista recibe $45.
                             </p>
                           </div>

                           <div className="space-y-2 max-h-72 overflow-y-auto">
                             {services.map((svc) => {
                               const fixed = overrides[svc.id];
                               const isSet = fixed !== null && fixed !== undefined;
                               
                               return (
                                 <div 
                                   key={svc.id} 
                                   className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                     isSet 
                                       ? 'bg-emerald-50 border-emerald-200' 
                                       : 'bg-white border-gray-200 hover:bg-gray-50'
                                   }`}
                                 >
                                   <div className="flex-1 min-w-0">
                                     <p className="text-sm font-medium truncate">{svc.name}</p>
                                     <p className="text-xs text-gray-500">
                                       Precio: {formatCurrency(svc.price)}
                                       {isSet && (
                                         <span className="ml-2 text-emerald-600 font-medium">
                                           → Founder: {formatCurrency(fixed!)}
                                         </span>
                                       )}
                                     </p>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <Input
                                       className="w-28 text-center text-sm"
                                       type="number"
                                       placeholder="0"
                                       value={overrides[svc.id] ?? ''}
                                       onChange={(e) => {
                                         const val = e.target.value;
                                         setOverrides({
                                           ...overrides,
                                           [svc.id]: val === '' ? null : parseFloat(val)
                                         });
                                       }}
                                     />
                                     {isSet && (
                                       <button
                                         type="button"
                                         onClick={() => {
                                           const newOverrides = { ...overrides };
                                           delete newOverrides[svc.id];
                                           setOverrides(newOverrides);
                                         }}
                                         className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                         title="Quitar excepción"
                                       >
                                         <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                       </button>
                                     )}
                                   </div>
                                 </div>
                               );
                             })}
                           </div>
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
             <div className="flex gap-3 pt-6 mt-2 border-t border-gray-100">
               {editingMember && !isOwnerMember(editingMember) && (
                 <Button
                   type="button"
                   variant="outline"
                   className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                   onClick={async () => {
                     if (editingMember) {
                       setShowModal(false);
                       setEditingMember(null);
                       resetStaffForm();
                       await handleDelete(editingMember);
                     }
                   }}
                 >
                   <Trash2 className="w-4 h-4 mr-1" />
                   Eliminar
                 </Button>
               )}
               <div className="flex-1" />
               <Button
                 type="button"
                 variant="outline"
                 onClick={() => { 
                   setShowModal(false); 
                   setEditingMember(null);
                   resetStaffForm();
                 }}
               >
                 Cancelar
               </Button>
               <Button type="submit">
                 <Check className="w-4 h-4 mr-1" />
                 {editingMember ? 'Actualizar' : 'Crear'}
               </Button>
             </div>
           </form>
         </div>
       </Modal>

      {/* Role Modal */}
      <Modal 
        open={showRoleModal} 
        onClose={() => { setShowRoleModal(false); setEditingRole(null); }} 
        title={editingRole ? 'Editar Rol' : 'Nuevo Rol'}
      >
        <form onSubmit={handleRoleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input 
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              placeholder="Ej: Dueña, CEO"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <Input 
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="Descripción breve"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={roleForm.color}
                onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
              />
              <Input 
                value={roleForm.color}
                onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                placeholder="#6B7280"
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => { setShowRoleModal(false); setEditingRole(null); }}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingRole ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
