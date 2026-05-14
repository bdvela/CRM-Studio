'use client';

import { useRef, useMemo } from 'react';
import type { StaffFormModalProps } from './types';
import { FORM_INIT } from './types';
import { StaffComisionesTab } from './StaffComisionesTab';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/DatePicker';
import { FlagPeru } from '@/components/ui/FlagPeru';
import { Checkbox } from '@/components/ui/checkbox';
import { formatPeruPhoneForInput } from '@/lib/utils';
import { UserRound, Briefcase, DollarSign, Check, Trash2, Clock, X } from 'lucide-react';

const STAFF_TABS = [
  { id: 'basicos' as const, label: 'Datos Básicos', icon: <UserRound className="size-4" /> },
  { id: 'especialidades' as const, label: 'Especialidades', icon: <Briefcase className="size-4" /> },
  { id: 'comisiones' as const, label: 'Comisiones', icon: <DollarSign className="size-4" /> },
];

function arraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function recordsEqual(a: Record<string, number | null>, b: Record<string, number | null>) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => a[key] === b[key]);
}

export function StaffFormModal({
  open, onClose, editingMember, form, dispatch,
  roles, categories, services,
  specialtySelections, setSpecialtySelections,
  overrides, setOverrides,
  submitting, deletingId,
  activeTab, setActiveTab,
  initialForm, initialSpecialties, initialOverrides,
  onSubmit, onDelete, isOwner,
}: StaffFormModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const isOwnerMember = isOwner(editingMember);

  const hasChanges = useMemo(() => {
    if (!editingMember) return true;
    const formChanged = JSON.stringify(form) !== JSON.stringify(initialForm);
    const specialtiesChanged = !arraysEqual(specialtySelections, initialSpecialties);
    const overridesChanged = !recordsEqual(overrides, initialOverrides);
    return formChanged || specialtiesChanged || overridesChanged;
  }, [form, initialForm, specialtySelections, initialSpecialties, overrides, initialOverrides, editingMember]);

  function handleClose() {
    if (!submitting) {
      dispatch({ type: 'SET', payload: FORM_INIT });
      setSpecialtySelections([]);
      setOverrides({});
      setActiveTab('basicos');
      onClose();
    }
  }

  function resetStaffForm() {
    const activeRoles = roles.filter(r => r.active && r.name.toLowerCase().trim() !== 'dueña' && r.name.toLowerCase().trim() !== 'founder');
    const firstRole = activeRoles[0];
    dispatch({ type: 'SET', payload: { ...FORM_INIT, role_id: firstRole?.id || '' } });
    setSpecialtySelections([]);
    setOverrides({});
    setActiveTab('basicos');
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={editingMember ? 'Editar Miembro' : 'Nuevo Miembro del Staff'}
    >
      <div className="space-y-4">
        {editingMember && !isOwnerMember && (
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
              style={{ backgroundColor: form.active ? '#22c55e' : '#d1d5db' }}
              aria-label={form.active ? 'Desactivar miembro' : 'Activar miembro'}
            >
              <div
                className="absolute top-0.5 size-5 bg-white rounded-full shadow transition-transform"
                style={{ left: form.active ? '2rem' : '0.25rem' }}
              />
            </button>
          </div>
        )}

        <Tabs
          tabs={STAFF_TABS}
          active={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
        />

        <form onSubmit={onSubmit}>
          {activeTab === 'basicos' && (
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
                  disabled={isOwnerMember}
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
                  disabled={isOwnerMember}
                  options={roles.reduce<{ value: string; label: string }[]>((acc, r) => {
                    if (r.active && (isOwnerMember || (r.name.toLowerCase().trim() !== 'dueña' && r.name.toLowerCase().trim() !== 'founder'))) {
                      acc.push({ value: r.id, label: r.name });
                    }
                    return acc;
                  }, [])}
                />
                {isOwnerMember && (
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

          {activeTab === 'especialidades' && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <span className="block text-sm font-medium text-zinc-700">Especialidades</span>
                <p className="text-xs text-zinc-500">
                  ¿Qué categorías de servicios maneja esta persona?
                </p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {categories.filter(c => c.active).map((c) => (
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
                        <span className="text-lg" aria-hidden="true">{c.icon || '📋'}</span>
                        <span className="text-sm font-medium text-zinc-900">{c.name}</span>
                        {c.description && (
                          <span className="text-xs text-zinc-400">- {c.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="staff-horario" className="block text-sm font-medium text-zinc-700">
                  <Clock className="size-4 inline mr-1" aria-hidden="true" />
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

          {activeTab === 'comisiones' && (
            <StaffComisionesTab
              isOwner={isOwnerMember}
              editingMember={editingMember}
              form={form}
              dispatch={dispatch}
              services={services}
              overrides={overrides}
              setOverrides={setOverrides}
            />
          )}

          <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 mt-2 border-t border-zinc-100">
            {editingMember && !isOwnerMember && (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 order-last sm:order-none"
                loading={deletingId === editingMember.id}
                onClick={async () => {
                  if (editingMember) {
                    handleClose();
                    await onDelete(editingMember);
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
        </form>
      </div>
    </Modal>
  );
}
