'use client';

import { useEffect, useState, useRef, useReducer } from 'react';
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

type FormState = StaffMemberInsert & { birthday_date: string | null };

type FormAction =
  | { type: 'UPDATE'; payload: Partial<FormState> }
  | { type: 'SET'; payload: FormState };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'UPDATE': return { ...state, ...action.payload };
    case 'SET': return action.payload;
    default: return state;
  }
}

function isOwnerRoleName(roleName: string | null | undefined): boolean {
  if (!roleName) return false;
  const normalized = roleName.toLowerCase().trim();
  return normalized === 'dueña' || normalized === 'founder';
}

function isOwnerMember(member: StaffMember | null): boolean {
  if (!member) return false;
  return isOwnerRoleName(member.role?.name);
}

function StaffCard({ member, onEdit }: { member: StaffMember; onEdit: (m: StaffMember) => void }) {
  const isOwner = isOwnerMember(member);
  return (
    <Card
      onClick={() => onEdit(member)}
      className={`relative cursor-pointer transition-all hover:shadow-md ${!member.active ? 'opacity-60' : ''} ${isOwner ? 'ring-2 ring-amber-200' : ''}`}
    >
      <CardContent className="py-5">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-bold text-lg flex-shrink-0">
            {member.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{member.name}</p>
            <Badge variant="custom" color={member.role?.color || '#6B7280'} className="mt-1">{member.role?.name || 'Sin rol'}</Badge>
            {member.phone && (
              <p className="flex items-center gap-1 text-xs text-zinc-400 mt-2">
                <Phone className="size-3" />{member.phone}
              </p>
            )}
          </div>
        </div>

        {member.staff_specialties && member.staff_specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {member.staff_specialties.map((spec) => (
              <Badge key={spec.id || spec.category_id} variant="custom" color={spec.category?.color || '#6B7280'} className="text-[10px]">
                {spec.category?.icon || ''} {spec.category?.name}
              </Badge>
            ))}
          </div>
        )}

        {member.staff_stats && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
            <span>{member.staff_stats.total_appointments} citas</span>
            <span>{formatCurrency(member.staff_stats.total_revenue)}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
          <span className="text-xs text-zinc-400">Comisión: <span className="font-semibold text-zinc-700">{member.commission_pct}%</span></span>
          {!member.active && <Badge variant="danger">Inactivo</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

function StaffFilters({ search, onSearchChange }: { search: string; onSearchChange: (s: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
      <input
        type="text"
        placeholder="Buscar por nombre o rol..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500"
      />
    </div>
  );
}

function StaffComisionesTab({
  isOwner, editingMember, form, dispatch,
  services, overrides, setOverrides,
}: {
  isOwner: boolean;
  editingMember: StaffMember | null;
  form: FormState;
  dispatch: React.Dispatch<FormAction>;
  services: Service[];
  overrides: Record<string, number | null>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, number | null>>>;
}) {
  const [overrideSearch, setOverrideSearch] = useState('');
  const [overrideDropdownOpen, setOverrideDropdownOpen] = useState(false);
  const overrideDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (overrideDropdownRef.current && !overrideDropdownRef.current.contains(e.target as Node)) {
        setOverrideDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4 pt-2">
      {isOwner ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-emerald-800">
              Founder / Dueña
            </span>
          </div>
          <p className="text-xs text-emerald-700">
            La Founder recibe el <strong>100%</strong> de todas las comisiones. Este valor no es modificable.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label htmlFor="staff-comision" className="block text-sm font-medium text-zinc-700">
              <DollarSign className="size-4 inline mr-1" />
              Comisión General (%)
            </label>
            <Input
              id="staff-comision"
              type="number"
              value={form.commission_pct}
              onChange={(value) => dispatch({ type: 'UPDATE', payload: { commission_pct: parseFloat(value) || 0 } })}
              placeholder="Ej: 70"
              min={0}
              max={100}
            />
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1">
              <p className="text-sm text-zinc-700">
                Ejemplo rápido:
              </p>
              <p className="text-xs text-zinc-500">
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

          <div className="border-t border-zinc-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-zinc-700">
                Excepciones por servicio
              </p>
              {Object.keys(overrides).length > 0 && (
                <span className="text-xs text-zinc-500">
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

            <div ref={overrideDropdownRef} className="relative mb-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                  <input
                    type="text"
                    value={overrideSearch}
                    onChange={(e) => {
                      setOverrideSearch(e.target.value);
                      setOverrideDropdownOpen(true);
                    }}
                    onFocus={() => setOverrideDropdownOpen(true)}
                    placeholder="Buscar servicio para agregar excepción..."
                    className="w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent"
                  />
                </div>
              </div>

              {overrideDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-zinc-200 shadow-lg max-h-64 overflow-y-auto">
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
                          <p className="text-sm text-zinc-400">No hay servicios que coincidan</p>
                        </div>
                      );
                    }

                    if (filtered.length === 0) {
                      return (
                        <div className="p-4 text-center">
                          <p className="text-sm text-zinc-400">
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
                          setOverrides((prev: Record<string, number | null>) => ({ ...prev, [svc.id]: 0 }));
                          setOverrideSearch('');
                          setOverrideDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{svc.name}</p>
                          <p className="text-xs text-zinc-500">
                            Precio: {formatCurrency(svc.price)}
                            {svc.category && (
                              <span className="ml-2">
                                • {svc.category.name}
                              </span>
                            )}
                          </p>
                        </div>
                        <Plus className="size-4 text-zinc-400" />
                      </button>
                    ));
                  })()}
                </div>
              )}
            </div>

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
                        <p className="text-sm font-medium text-zinc-900 truncate">{svc.name}</p>
                        <p className="text-xs text-zinc-500">
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
                            onChange={(value) => {
                              setOverrides((prev: Record<string, number | null>) => ({
                                ...prev,
                                [serviceId]: value === '' ? null : parseFloat(value)
                              }));
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOverrides((prev: Record<string, number | null>) => {
                              const next = { ...prev };
                              delete next[serviceId];
                              return next;
                            });
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                          title="Quitar excepción"
                        >
                          <X className="size-4 text-zinc-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-zinc-200 rounded-xl">
                <p className="text-sm text-zinc-400">No hay excepciones configuradas</p>
                <p className="text-xs text-zinc-400 mt-1">Usa el buscador de arriba para agregar</p>
              </div>
            )}
          </div>
        </>
      )}

      {editingMember && (
        <div className="border-t border-zinc-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-zinc-700">
              <TrendingUp className="size-4 inline mr-1" />
              Resumen
            </p>
            <button
              type="button"
              onClick={() => window.location.href = '/reportes/comisiones'}
              className="text-xs text-salon-600 hover:text-salon-700 font-medium flex items-center gap-1"
            >
              Ver reporte completo
              <ExternalLink className="size-3" />
            </button>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
            {editingMember.staff_stats ? (
              <>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-zinc-500">Citas</p>
                    <p className="font-semibold text-zinc-900">{editingMember.staff_stats.total_appointments}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Ingreso</p>
                    <p className="font-semibold text-zinc-900">
                      {formatCurrency(editingMember.staff_stats.total_revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Comisión %</p>
                    <p className="font-semibold text-accent-600">
                      {editingMember.commission_pct}%
                    </p>
                  </div>
                </div>
                {editingMember.last_commission_paid && (
                  <div className="pt-3 border-t border-zinc-200">
                    <p className="text-xs text-zinc-500">
                      Última comisión pagada: <strong>{formatDate(editingMember.last_commission_paid)}</strong>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-zinc-400 text-center">
                Aún no hay datos históricos para este miembro.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StaffFormModal({
  open, onClose, editingMember, form, dispatch,
  roles, categories, services,
  specialtySelections, setSpecialtySelections,
  overrides, setOverrides,
  submitting, deletingId,
  activeStaffTab, setActiveStaffTab,
  initialForm, initialSpecialties, initialOverrides,
  handleSubmit, handleDelete, isOwnerMember,
}: {
  open: boolean;
  onClose: () => void;
  editingMember: StaffMember | null;
  form: FormState;
  dispatch: React.Dispatch<FormAction>;
  roles: Role[];
  categories: Category[];
  services: Service[];
  specialtySelections: string[];
  setSpecialtySelections: React.Dispatch<React.SetStateAction<string[]>>;
  overrides: Record<string, number | null>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, number | null>>>;
  submitting: boolean;
  deletingId: string | null;
  activeStaffTab: StaffModalTab;
  setActiveStaffTab: React.Dispatch<React.SetStateAction<StaffModalTab>>;
  initialForm: any;
  initialSpecialties: string[];
  initialOverrides: Record<string, number | null>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleDelete: (member: StaffMember) => Promise<void>;
  isOwnerMember: (member: StaffMember | null) => boolean;
}) {

  function resetStaffForm() {
    const activeRoles = roles.filter(r => r.active && !isOwnerRoleName(r.name));
    dispatch({ type: 'SET', payload: {
      name: '', phone: '', role_id: activeRoles[0]?.id || '',
      commission_pct: 0, schedule: '', photo_url: null,
      active: true, last_commission_paid: null, birthday_date: null,
    }});
    setSpecialtySelections([]);
    setOverrides({});
    setActiveStaffTab('basicos');
  }

  function handleClose() {
    onClose();
    resetStaffForm();
  }

  const staffTabs = [
    { id: 'basicos' as StaffModalTab, label: 'Datos Básicos', icon: <UserRound className="size-4" /> },
    { id: 'especialidades' as StaffModalTab, label: 'Especialidades', icon: <Briefcase className="size-4" /> },
    { id: 'comisiones' as StaffModalTab, label: 'Comisiones', icon: <DollarSign className="size-4" /> },
  ];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={editingMember ? 'Editar Miembro' : 'Nuevo Miembro del Staff'}
    >
      <div className="space-y-4">
        {editingMember && !isOwnerMember(editingMember) && (
          <div className="flex items-center justify-between p-3 rounded-xl border bg-zinc-50 border-zinc-200">
            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full ${form.active ? 'bg-green-500' : 'bg-zinc-400'}`} />
              <span className="text-sm font-medium text-zinc-700">
                {form.active ? 'Activo' : 'Inactivo'}
              </span>
              {!form.active && (
                <span className="text-xs text-zinc-400">
                  (No aparecerá para asignar citas)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'UPDATE', payload: { active: !form.active } })}
              className="relative w-14 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-salon-500 focus:ring-offset-2"
              style={{
                backgroundColor: form.active ? '#22c55e' : '#d1d5db'
              }}
            >
              <div
                className="absolute top-0.5 size-5 bg-white rounded-full shadow transition-transform"
                style={{
                  left: form.active ? '2rem' : '0.25rem'
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
          {activeStaffTab === 'basicos' && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label htmlFor="staff-nombre" className="block text-sm font-medium text-zinc-700">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <Input
                  id="staff-nombre"
                  value={form.name}
                  onChange={(value) => dispatch({ type: 'UPDATE', payload: { name: value } })}
                  placeholder="Nombre completo"
                  disabled={isOwnerMember(editingMember)}
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="staff-telefono" className="block text-sm font-medium text-zinc-700">Teléfono</label>
                <Input
                  id="staff-telefono"
                  leftPrefix={<FlagPeru className="size-5" />}
                  value={form.phone || ''}
                  onChange={(value) => dispatch({ type: 'UPDATE', payload: { phone: formatPeruPhoneForInput(value) } })}
                  placeholder="987 654 321"
                  numeric
                  maxLength={11}
                  minLength={9}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="staff-rol" className="block text-sm font-medium text-zinc-700">
                  Rol <span className="text-red-500">*</span>
                </label>
                <Select
                  id="staff-rol"
                  value={form.role_id}
                  onChange={(value) => dispatch({ type: 'UPDATE', payload: { role_id: value } })}
                  disabled={isOwnerMember(editingMember)}
                  options={
                    roles.reduce<{ value: string; label: string }[]>((acc, r) => {
                      if (r.active && (isOwnerMember(editingMember) || !isOwnerRoleName(r.name))) {
                        acc.push({ value: r.id, label: r.name });
                      }
                      return acc;
                    }, [])
                  }
                />
                {isOwnerMember(editingMember) && (
                  <p className="text-xs text-zinc-500 mt-1">
                    El rol de Dueña no se puede cambiar.
                  </p>
                )}
              </div>

              <DatePicker
                label="Fecha de Cumpleaños"
                value={form.birthday_date}
                onChange={(val) => dispatch({ type: 'UPDATE', payload: { birthday_date: val } })}
                placeholder="Seleccionar fecha de cumpleaños"
              />
            </div>
          )}

          {activeStaffTab === 'especialidades' && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <span className="block text-sm font-medium text-zinc-700">Especialidades</span>
                <p className="text-xs text-zinc-500">
                  ¿Qué categorías de servicios maneja esta persona?
                </p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {categories.flatMap(c => c.active ? [(
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                      <Checkbox
                        checked={specialtySelections.includes(c.id)}
                        onChange={(checked) => {
                          setSpecialtySelections(
                            checked
                              ? [...specialtySelections, c.id]
                              : specialtySelections.filter(s => s !== c.id)
                          );
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{c.icon || '📋'}</span>
                        <span className="text-sm font-medium text-zinc-900">{c.name}</span>
                        {c.description && (
                          <span className="text-xs text-zinc-400">
                            - {c.description}
                          </span>
                        )}
                      </div>
                    </div>
                  )] : [])}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="staff-horario" className="block text-sm font-medium text-zinc-700">
                  <Clock className="size-4 inline mr-1" />
                  Horario
                </label>
                <Textarea
                  id="staff-horario"
                  value={form.schedule || ''}
                  onChange={(value) => dispatch({ type: 'UPDATE', payload: { schedule: value } })}
                  placeholder="Ej: Lun-Sáb 9:00-18:00"
                  maxLength={200}
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Opcional: para saber cuándo trabaja
                </p>
              </div>
            </div>
          )}

          {activeStaffTab === 'comisiones' && (
            <StaffComisionesTab
              isOwner={isOwnerMember(editingMember)}
              editingMember={editingMember}
              form={form}
              dispatch={dispatch}
              services={services}
              overrides={overrides}
              setOverrides={setOverrides}
            />
          )}

          {(() => {
            const arraysEqual = (a: string[], b: string[]) =>
              a.length === b.length && a.every((item, index) => item === b[index]);

            const recordsEqual = (a: Record<string, number | null>, b: Record<string, number | null>) => {
              const keysA = Object.keys(a);
              const keysB = Object.keys(b);
              if (keysA.length !== keysB.length) return false;
              return keysA.every((key) => a[key] === b[key]);
            };

            const isEditing = !!editingMember;
            const formChanged = JSON.stringify(form) !== JSON.stringify(initialForm);
            const specialtiesChanged = !arraysEqual(specialtySelections, initialSpecialties);
            const overridesChanged = !recordsEqual(overrides, initialOverrides);

            const hasChanges = !isEditing || formChanged || specialtiesChanged || overridesChanged;

            return (
              <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 mt-2 border-t border-zinc-100">
                {editingMember && !isOwnerMember(editingMember) && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 order-last sm:order-none"
                    loading={deletingId === editingMember.id}
                    onClick={async () => {
                      if (editingMember) {
                        handleClose();
                        await handleDelete(editingMember);
                      }
                    }}
                  >
                    {deletingId !== editingMember.id && <Trash2 className="size-4 mr-1" />}
                    {deletingId === editingMember.id ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                )}

                <div className="hidden sm:block flex-1" />

                <div className="flex flex-1 sm:flex-none gap-2 order-first sm:order-none">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!hasChanges}
                    loading={submitting}
                  >
                    {!submitting && <Check className="size-4 mr-1" />}
                    {submitting ? 'Guardando...' : (editingMember ? 'Actualizar' : 'Crear')}
                  </Button>
                </div>
              </div>
            );
          })()}
        </form>
      </div>
    </Modal>
  );
}

interface StaffDataState {
  members: StaffMember[];
  roles: Role[];
  categories: Category[];
  services: Service[];
  loading: boolean;
}

const DATA_INIT: StaffDataState = {
  members: [], roles: [], categories: [], services: [], loading: true,
};

function dataReducer(state: StaffDataState, action: Partial<StaffDataState>): StaffDataState {
  return { ...state, ...action };
}

interface StaffUIState {
  submitting: boolean;
  deletingId: string | null;
  showModal: boolean;
  editingMember: StaffMember | null;
  search: string;
  activeStaffTab: StaffModalTab;
  specialtySelections: string[];
  overrides: Record<string, number | null>;
}

const UI_INIT: StaffUIState = {
  submitting: false, deletingId: null, showModal: false,
  editingMember: null, search: '', activeStaffTab: 'basicos',
  specialtySelections: [], overrides: {},
};

function staffUIReducer(state: StaffUIState, action: Partial<StaffUIState>): StaffUIState {
  return { ...state, ...action };
}

export default function StaffPage({ initialData }: {
  initialData?: {
    members: StaffMember[];
    roles: Role[];
    categories: Category[];
    services: Service[];
  };
}) {
  const { confirm } = useConfirm();
  const [data, dispatchData] = useReducer(
    dataReducer,
    initialData
      ? {
          members: initialData.members,
          roles: initialData.roles,
          categories: initialData.categories,
          services: initialData.services,
          loading: false,
        }
      : DATA_INIT,
  );
  const [ui, dispatchUI] = useReducer(staffUIReducer, UI_INIT);

  const [form, dispatch] = useReducer(formReducer, {
    name: '', phone: '', role_id: '', commission_pct: 0,
    schedule: '', photo_url: null, active: true,
    last_commission_paid: null, birthday_date: null,
  });

  const [initialForm, setInitialForm] = useState<any>(null);
  const [initialSpecialties, setInitialSpecialties] = useState<string[]>([]);
  const [initialOverrides, setInitialOverrides] = useState<Record<string, number | null>>({});
  const skipInitialLoad = useRef(!!initialData);

  async function load() {
    try {
      const [staffData, rolesData, categoriesData, servicesData] = await Promise.all([
        getStaff(false),
        getRoles(false),
        getCategories(true),
        getServices(true),
      ]);
      dispatchData({
        members: staffData as unknown as StaffMember[],
        roles: rolesData as Role[],
        categories: categoriesData as Category[],
        services: servicesData as Service[],
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ui.submitting) return;
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!form.role_id) { toast.error('Selecciona un rol'); return; }
    const normalizedPhone = normalizePeruPhone(form.phone);
    const formToSave = { ...form, phone: normalizedPhone };

    dispatchUI({ submitting: true });
    try {
      let staffId: string;

      if (ui.editingMember) {
        staffId = ui.editingMember.id;

        let formToSaveProtected = { ...formToSave };
        if (isOwnerMember(ui.editingMember)) {
          formToSaveProtected = {
            ...formToSaveProtected,
            role_id: ui.editingMember.role_id,
            active: true,
          };
        }

        await updateStaff(staffId, formToSaveProtected);
        await updateStaffSpecialties(staffId, ui.specialtySelections);
      } else {
        const formToCreate = { ...formToSave, active: true };
        const newMember = await createStaff(formToCreate);
        if (!newMember?.id) {
          toast.error('Error al crear miembro');
          return;
        }
        staffId = newMember.id;
        if (ui.specialtySelections.length > 0) {
          await updateStaffSpecialties(staffId, ui.specialtySelections);
        }
      }

      await Promise.all(
        Object.entries(ui.overrides).map(([serviceId, fixedAmount]) =>
          fixedAmount !== null && fixedAmount >= 0
            ? upsertCommissionOverride({
                staff_id: staffId,
                service_id: serviceId,
                founder_fixed_amount: fixedAmount,
              })
            : deleteCommissionOverride(staffId, serviceId)
        )
      );

      toast.success(ui.editingMember ? 'Miembro actualizado' : 'Miembro del staff creado');

      dispatchUI({ showModal: false, editingMember: null });
      load();
    } catch (e) {
      console.error(e);
      toast.error(ui.editingMember ? 'Error al actualizar' : 'Error al crear');
    } finally {
      dispatchUI({ submitting: false });
    }
  }

  async function openEdit(member: StaffMember) {
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

    dispatch({ type: 'SET', payload: newForm });

    const currentSpecIds = member.staff_specialties?.map(s => s.category_id) || [];

    const overridesData = await getCommissionOverrides(member.id);
    const map: Record<string, number | null> = {};
    overridesData.forEach((o: any) => {
      if (o.service_id) {
        map[o.service_id] = o.founder_fixed_amount;
      }
    });

    setInitialForm({ ...newForm });
    setInitialSpecialties([...currentSpecIds]);
    setInitialOverrides({ ...map });

    dispatchUI({
      editingMember: member,
      specialtySelections: currentSpecIds,
      overrides: map,
      activeStaffTab: 'basicos',
      showModal: true,
    });
  }

  function openNew() {
    const activeRoles = data.roles.filter(r => r.active && !isOwnerRoleName(r.name));
    dispatch({ type: 'SET', payload: {
      name: '', phone: '', role_id: activeRoles[0]?.id || '',
      commission_pct: 0, schedule: '', photo_url: null,
      active: true, last_commission_paid: null, birthday_date: null,
    }});
    setInitialForm({
      name: '', phone: '', role_id: activeRoles[0]?.id || '',
      commission_pct: 0, schedule: '', photo_url: null,
      active: true, last_commission_paid: null, birthday_date: null,
    });
    setInitialSpecialties([]);
    setInitialOverrides({});

    dispatchUI({
      editingMember: null,
      specialtySelections: [],
      overrides: {},
      activeStaffTab: 'basicos',
      showModal: true,
    });
  }

  async function handleDelete(member: StaffMember) {
    if (isOwnerMember(member)) {
      toast.error('No se puede eliminar a la Dueña');
      return;
    }
    if (ui.deletingId) return;

    const confirmed = await confirm({
      title: 'Eliminar miembro',
      message: `¿Eliminar a ${member.name}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmed) return;

    dispatchUI({ deletingId: member.id });
    try {
      await deleteStaff(member.id);
      toast.success('Staff eliminado');
      load();
    } catch (e) {
      toast.error('Error al eliminar');
    } finally {
      dispatchUI({ deletingId: null });
    }
  }

  const filtered = data.members.filter((m) => {
    const s = ui.search.toLowerCase();
    return m.name.toLowerCase().includes(s) ||
      (m.phone || '').includes(s) ||
      m.role?.name.toLowerCase().includes(s);
  });

  return (
    <>
      <Header title="Staff / Artists" action={
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4 mr-1" /> Nuevo
        </Button>
      } />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
        <StaffFilters search={ui.search} onSearchChange={(v) => dispatchUI({ search: v })} />

        {data.loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Card key={`staff-sk-${n}`}>
                <CardContent className="py-5">
                  <div className="flex items-start gap-4">
                    <Skeleton className="size-12 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-zinc-400">
              <UserRound className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay miembros del staff {ui.search ? 'que coincidan' : 'registrados'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((member) => (
              <StaffCard key={member.id} member={member} onEdit={openEdit} />
            ))}
          </div>
        )}
      </div>

      <StaffFormModal
        open={ui.showModal}
        onClose={() => {
          dispatchUI({ showModal: false, editingMember: null });
        }}
        editingMember={ui.editingMember}
        form={form}
        dispatch={dispatch}
        roles={data.roles}
        categories={data.categories}
        services={data.services}
        specialtySelections={ui.specialtySelections}
        setSpecialtySelections={(v) => dispatchUI({ specialtySelections: typeof v === 'function' ? v(ui.specialtySelections) : v })}
        overrides={ui.overrides}
        setOverrides={(v) => dispatchUI({ overrides: typeof v === 'function' ? v(ui.overrides) : v })}
        submitting={ui.submitting}
        deletingId={ui.deletingId}
        activeStaffTab={ui.activeStaffTab}
        setActiveStaffTab={(v) => dispatchUI({ activeStaffTab: typeof v === 'function' ? v(ui.activeStaffTab) : v })}
        initialForm={initialForm}
        initialSpecialties={initialSpecialties}
        initialOverrides={initialOverrides}
        handleSubmit={handleSubmit}
        handleDelete={handleDelete}
        isOwnerMember={isOwnerMember}
      />
    </>
  );
}
