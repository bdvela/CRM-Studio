export type ClientStatus = 'prospecto' | 'activa' | 'inactiva' | 'vip';
export type AppointmentStatus = 'programada' | 'en_curso' | 'completada' | 'cancelada' | 'no_show';
export type ServiceCategory = 'sistema_unas' | 'pedicura' | 'makeup' | 'pestanas' | 'cejas';
export type StaffRole = 'nail_artist' | 'lashista' | 'pedicurista' | 'maquillista' | 'otro';
export type PaymentType = 'ingreso' | 'egreso';
export type PaymentCategory = 'servicio' | 'insumo' | 'alquiler' | 'marketing' | 'comisiones' | 'otro';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'yape_plin';
export type PaymentKind = 'reserva' | 'pago_completo' | 'pago_final';

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  sistema_unas: 'Sistema de uñas',
  pedicura: 'Pedicura',
  makeup: 'Makeup',
  pestanas: 'Pestañas',
  cejas: 'Cejas',
};

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  nail_artist: 'Nail Artist',
  lashista: 'Lashista',
  pedicurista: 'Pedicurista',
  maquillista: 'Maquillista',
  otro: 'Otro',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  programada: 'Programada',
  en_curso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_show: 'No-show',
};

export const PAYMENT_KIND_LABELS: Record<PaymentKind, string> = {
  reserva: 'Reserva',
  pago_completo: 'Pago completo',
  pago_final: 'Pago final',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  yape_plin: 'Yape/Plin',
};

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  status: ClientStatus;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  client_stats?: {
    total_appointments: number;
    total_spent: number;
    last_visit: string | null;
  };
}

export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'updated_at' | 'client_stats'>;

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  duration_min: number;
  price: number;
  description: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type ServiceInsert = Omit<Service, 'id' | 'created_at' | 'updated_at'>;

export interface StaffMember {
  id: string;
  name: string;
  phone: string | null;
  role: StaffRole;
  specialties: ServiceCategory[] | null;
  commission_pct: number;
  schedule: string | null;
  photo_url: string | null;
  active: boolean;
  last_commission_paid: string | null;
  created_at: string;
  updated_at: string;
  staff_stats?: {
    total_appointments: number;
    total_revenue: number;
    last_appointment: string | null;
  };
}

export type StaffMemberInsert = Omit<StaffMember, 'id' | 'created_at' | 'updated_at' | 'staff_stats'>;

export interface Appointment {
  id: string;
  client_id: string | null;
  artist_id: string | null;
  title: string;
  start_time: string;
  end_time: string | null;
  status: AppointmentStatus;
  total_price: number;
  total_duration_min: number;
  notes: string | null;
  color: string | null;
  overlap_detected: boolean;
  created_at: string;
  updated_at: string;
  client?: { name: string; phone: string | null };
  artist?: { name: string; photo_url: string | null };
  appointment_services?: Array<{
    service: { name: string; price: number; duration_min: number; category: ServiceCategory };
  }>;
  appointment_balance?: {
    total_price: number;
    total_paid: number;
    pending_balance: number;
    paid_in_full: boolean;
  };
}

export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'client' | 'artist' | 'appointment_services' | 'appointment_balance'>;

export interface Payment {
  id: string;
  concept: string;
  date: string;
  amount: number;
  type: PaymentType;
  category: PaymentCategory;
  payment_kind: PaymentKind | null;
  payment_method: PaymentMethod | null;
  appointment_id: string | null;
  client_id: string | null;
  receipt_url: string | null;
  paid: boolean;
  created_at: string;
  updated_at: string;
  client?: { name: string };
  appointment?: { title: string };
}

export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
