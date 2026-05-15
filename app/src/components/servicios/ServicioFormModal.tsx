'use client';

import { Palette, Users, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs } from '@/components/ui/tabs';
import { ServicioStaffTab } from './ServicioStaffTab';
import type { ServicioFormModalProps } from './types';

const MODAL_TAB_BASIC = 'basic';
const MODAL_TAB_STAFF = 'staff';

export function ServicioFormModal({
  open, editingService, form, dispatch,
  activeModalTab, onActiveModalTabChange,
  selectedStaffIds, deletingServiceId, submitting,
  allStaff, categories, categoryOptions,
  onClose, onCategoryChange, onStaffToggle, onSubmit, onDelete,
  isFormValid, haveFormChanges,
}: ServicioFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Tabs
          tabs={[
            { id: MODAL_TAB_BASIC, label: 'Datos Básicos', icon: <Palette className="size-4" aria-hidden="true" /> },
            { id: MODAL_TAB_STAFF, label: 'Staff', icon: <Users className="size-4" aria-hidden="true" /> },
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

            <PriceSection form={form} dispatch={dispatch} />

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
              aria-label={`Eliminar servicio ${editingService.name}`}
            >
              {deletingServiceId !== editingService.id && <Trash2 className="size-4 mr-1" aria-hidden="true" />}
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

function PriceSection({ form, dispatch }: {
  form: ServicioFormModalProps['form'];
  dispatch: ServicioFormModalProps['dispatch'];
}) {
  const isFixed = form.price_type === 'fixed';

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-zinc-700">Precio</span>

      <div className="flex flex-col md:flex-row gap-2 items-start">
        <div className="w-full md:w-36 md:flex-shrink-0">
          <Select
            value={form.price_type}
            onChange={(value) => dispatch({ type: 'UPDATE', payload: { price_type: value as 'fixed' | 'variable' } })}
            options={[
              { value: 'fixed', label: 'Fijo' },
              { value: 'variable', label: 'Variable' },
            ]}
          />
        </div>

        {isFixed ? (
          <div className="w-full md:flex-1">
            <Input
              type="number"
              step="0.01"
              value={form.price || ''}
              onChange={(value) => dispatch({ type: 'UPDATE', payload: { price: parseFloat(value) || 0 } })}
              placeholder="0.00"
              aria-label="Precio fijo en soles"
              leftPrefix={<span className="text-base font-medium select-none">S/</span>}
            />
          </div>
        ) : (
          <div className="w-full flex gap-2 items-center">
            <div className="flex-1">
              <Input
                type="number"
                step="0.01"
                value={form.price_from ?? ''}
                onChange={(value) => dispatch({ type: 'UPDATE', payload: { price_from: value ? parseFloat(value) : null } })}
                placeholder="Desde"
                aria-label="Precio desde"
                leftPrefix={<span className="text-base font-medium select-none">S/</span>}
              />
            </div>
            <span className="hidden md:inline text-zinc-400 text-lg font-light flex-shrink-0">-</span>
            <div className="flex-1">
              <Input
                type="number"
                step="0.01"
                value={form.price_to ?? ''}
                onChange={(value) => dispatch({ type: 'UPDATE', payload: { price_to: value ? parseFloat(value) : null } })}
                placeholder="Hasta"
                aria-label="Precio hasta"
                leftPrefix={<span className="text-base font-medium select-none">S/</span>}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
