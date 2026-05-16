'use client';

import type {
  Payment,
  PaymentInsert,
  Client,
} from '@/types/database';

export type TabId = 'registrar' | 'comisiones';

export interface PaymentWithRelations extends Omit<Payment, 'client' | 'appointment'> {
  client?: { name: string; phone?: string | null; id?: string } | null;
  appointment?: {
    id?: string;
    title: string;
    start_time?: string;
    end_time?: string;
    status?: string;
    total_price?: number;
    appointment_balance?: {
      total_paid: number;
      pending_balance: number;
    };
    appointment_services?: Array<{
      service_id: string;
      service_price: number | null;
      service?: { name: string; price: number };
      artist?: { name: string };
    }>;
  } | null;
}

export type FormAction =
  | { type: 'SET'; payload: Partial<PaymentInsert> }
  | { type: 'RESET'; payload: PaymentInsert };

export interface PaymentCardProps {
  payment: PaymentWithRelations;
  onClick: () => void;
}

export interface PaymentFiltersProps {
  search: string;
  filterType: string;
  onSearchChange: (value: string) => void;
  onFilterTypeChange: (value: string) => void;
  onNewClick: () => void;
}

export interface PagosSummaryCardsProps {
  totalIngresos: number;
  totalEgresos: number;
}

export interface PagosTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export interface PaymentFormModalProps {
  open: boolean;
  submitting: boolean;
  form: PaymentInsert;
  dispatchForm: React.Dispatch<FormAction>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

export interface PaymentDetailModalProps {
  payment: Payment;
  appointment: Record<string, any> | null;
  client: Client | null;
  onClose: () => void;
  onGoToAppointment: () => void;
  onGoToClient: () => void;
}

export const FORM_INIT: PaymentInsert = {
  concept: '',
  date: '',
  amount: 0,
  type: 'ingreso',
  category: 'servicio',
  payment_kind: 'reserva',
  payment_method: 'yape_plin',
  appointment_id: null,
  client_id: null,
  receipt_url: null,
  paid: true,
};

export function formReducer(state: PaymentInsert, action: FormAction): PaymentInsert {
  switch (action.type) {
    case 'SET': {
      const result = { ...state, ...action.payload };
      if (action.payload.type && action.payload.type !== state.type) {
        if (action.payload.type === 'egreso') {
          result.payment_kind = null;
          result.payment_method = null;
        } else {
          result.category = 'servicio';
        }
      }
      return result;
    }
    case 'RESET':
      return action.payload;
    default:
      return state;
  }
}
