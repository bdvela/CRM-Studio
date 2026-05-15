import type { ClientInsert, ClientStatus, AppointmentStatus } from '@/types/database';

export const STATUS_LABELS: Record<ClientStatus, string> = {
  prospecto: 'Prospecto',
  activa: 'Activa',
  inactiva: 'Inactiva',
  vip: 'VIP',
};

export const STATUS_BADGE_VARIANT: Record<ClientStatus, 'warning' | 'success' | 'danger' | 'purple'> = {
  prospecto: 'warning',
  activa: 'success',
  inactiva: 'danger',
  vip: 'purple',
};

export const STATUS_BORDER_COLOR: Record<ClientStatus, string> = {
  prospecto: 'border-l-blue-400',
  activa: 'border-l-emerald-400',
  inactiva: 'border-l-zinc-300',
  vip: 'border-l-amber-400',
};

export const STATUS_OPTIONS = [
  { value: 'all' as const, label: 'Todos' },
  { value: 'prospecto' as const, label: 'Prospecto' },
  { value: 'activa' as const, label: 'Activa' },
  { value: 'inactiva' as const, label: 'Inactiva' },
  { value: 'vip' as const, label: 'VIP' },
];

export const STATUS_ORDER: ClientStatus[] = ['activa', 'vip', 'prospecto', 'inactiva'];

export const FORM_INIT: ClientInsert = {
  name: '',
  phone: '',
  email: '',
  instagram: '',
  status: 'prospecto',
  notes: '',
  photo_url: null,
};

export const PAGE_SIZE = 15;

export const APPT_STATUS_STYLES: Record<AppointmentStatus, string> = {
  completada: 'text-green-600 bg-green-50',
  programada: 'text-blue-600 bg-blue-50',
  cancelada: 'text-red-600 bg-red-50',
  no_show: 'text-orange-600 bg-orange-50',
  en_curso: 'text-amber-600 bg-amber-50',
};
