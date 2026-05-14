'use client';

import { useReducer, useMemo, useEffect } from 'react';
import type { ClientFormModalProps } from './types';
import type { ClientInsert } from '@/types/database';
import { FORM_INIT } from './constants';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FlagPeru } from '@/components/ui/FlagPeru';
import { formatPeruPhoneForInput } from '@/lib/utils';

function formReducer(state: ClientInsert, action: Partial<ClientInsert>) {
  return { ...state, ...action };
}

function formEqual(a: ClientInsert, b: ClientInsert) {
  return a.name === b.name
    && a.phone === b.phone
    && a.email === b.email
    && a.instagram === b.instagram
    && a.status === b.status
    && a.notes === b.notes
    && a.photo_url === b.photo_url;
}

export function ClientFormModal({
  open,
  onClose,
  onSave,
  initialData,
  title,
  submitting = false,
}: ClientFormModalProps) {
  const isEdit = !!initialData;
  const [form, dispatch] = useReducer(formReducer, isEdit && initialData ? { ...initialData } : { ...FORM_INIT });

  useEffect(() => {
    if (open) {
      if (initialData) {
        dispatch({ ...initialData });
      } else {
        dispatch({ ...FORM_INIT });
      }
    }
  }, [open]);

  const hasChanges = useMemo(() => {
    if (!isEdit || !initialData) return true;
    return !formEqual(form, initialData);
  }, [form, initialData, isEdit]);

  const isValid = form.name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !isValid) return;
    await onSave(form);
  }

  return (
    <Modal open={open} onClose={onClose} title={title || (isEdit ? 'Editar clienta' : 'Nueva Clienta')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre *"
          value={form.name}
          onChange={(value) => dispatch({ name: value })}
          placeholder="Nombre completo"
          minLength={2}
          maxLength={100}
        />
        <Input
          label="Teléfono"
          leftPrefix={<FlagPeru className="size-5" />}
          value={form.phone || ''}
          onChange={(value) => dispatch({ phone: formatPeruPhoneForInput(value) })}
          placeholder="987 654 321"
          maxLength={11}
        />
        <Input
          label="Email"
          type="email"
          value={form.email || ''}
          onChange={(value) => dispatch({ email: value })}
          placeholder="email@ejemplo.com"
          maxLength={100}
        />
        <Input
          label="Instagram"
          value={form.instagram || ''}
          onChange={(value) => dispatch({ instagram: value })}
          placeholder="@usuario"
          maxLength={50}
        />
        <Select
          label="Estado"
          value={form.status}
          onChange={(value) => dispatch({ status: value as ClientInsert['status'] })}
          options={[
            { value: 'prospecto', label: 'Prospecto' },
            { value: 'activa', label: 'Activa' },
            { value: 'inactiva', label: 'Inactiva' },
            { value: 'vip', label: 'VIP' },
          ]}
        />
        <Textarea
          label="Notas"
          value={form.notes || ''}
          onChange={(value) => dispatch({ notes: value })}
          placeholder="Preferencias, alergias, etc."
          maxLength={500}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" loading={submitting} disabled={!isValid || (isEdit && !hasChanges)}>
            {submitting ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
