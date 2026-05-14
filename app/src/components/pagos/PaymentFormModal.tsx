'use client';

import type { PaymentFormModalProps } from './types';
import type { PaymentType, PaymentKind, PaymentMethod, PaymentCategory } from '@/types/database';
import { DEPOSIT_AMOUNT } from '@/lib/constants';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Receipt } from 'lucide-react';

export function PaymentFormModal({
  open,
  submitting,
  form,
  dispatchForm,
  onSubmit,
  onClose,
}: PaymentFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Registrar Pago">
      <form onSubmit={onSubmit} className="space-y-4">
        <Select
          id="pago-tipo"
          label="Tipo"
          value={form.type}
          onChange={(value) =>
            dispatchForm({ type: 'SET', payload: { type: value as PaymentType } })
          }
          options={[
            { value: 'ingreso', label: 'Ingreso' },
            { value: 'egreso', label: 'Egreso' },
          ]}
        />

        <Input
          label="Concepto *"
          value={form.concept}
          onChange={(value) =>
            dispatchForm({ type: 'SET', payload: { concept: value } })
          }
          placeholder="Ej: Pago de María García"
          maxLength={200}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Monto *"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(value) =>
              dispatchForm({ type: 'SET', payload: { amount: parseFloat(value) || 0 } })
            }
          />
          <Input
            label="Fecha"
            type="date"
            value={form.date}
            onChange={(value) =>
              dispatchForm({ type: 'SET', payload: { date: value } })
            }
          />
        </div>

        {form.type === 'ingreso' && (
          <>
            <Select
              id="pago-tipo-pago"
              label="Tipo de pago"
              value={form.payment_kind || ''}
              onChange={(value) =>
                dispatchForm({ type: 'SET', payload: { payment_kind: value as PaymentKind } })
              }
              options={[
                { value: 'reserva', label: `Reserva (S/${DEPOSIT_AMOUNT})` },
                { value: 'pago_completo', label: 'Pago completo (press-on)' },
                { value: 'pago_final', label: 'Pago final (saldo)' },
              ]}
            />
            <Select
              id="pago-metodo"
              label="Método de pago"
              value={form.payment_method || ''}
              onChange={(value) =>
                dispatchForm({ type: 'SET', payload: { payment_method: value as PaymentMethod } })
              }
              options={[
                { value: '', label: 'Seleccionar...' },
                { value: 'efectivo', label: 'Efectivo' },
                { value: 'tarjeta', label: 'Tarjeta' },
                { value: 'transferencia', label: 'Transferencia' },
                { value: 'yape_plin', label: 'Yape/Plin' },
              ]}
            />
          </>
        )}

        {form.type === 'egreso' && (
          <Select
            id="pago-categoria"
            label="Categoría"
            value={form.category}
            onChange={(value) =>
              dispatchForm({ type: 'SET', payload: { category: value as PaymentCategory } })
            }
            options={[
              { value: 'servicio', label: 'Servicio' },
              { value: 'insumo', label: 'Insumo' },
              { value: 'alquiler', label: 'Alquiler' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'comisiones', label: 'Comisiones' },
              { value: 'otro', label: 'Otro' },
            ]}
          />
        )}

        <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 mt-2 border-t border-zinc-100">
          <div className="hidden sm:block flex-1" />
          <div className="flex flex-1 sm:flex-none gap-2 order-first sm:order-none">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={submitting} disabled={!form.concept.trim() || form.amount <= 0}>
              {!submitting && <Receipt className="size-4 mr-1" />}
              {submitting ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
