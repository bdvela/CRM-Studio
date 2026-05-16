export type ClientStatus = 'prospecto' | 'activa' | 'inactiva' | 'vip';
export type AppointmentStatus = 'programada' | 'en_curso' | 'completada' | 'cancelada' | 'no_show';
export type PaymentType = 'ingreso' | 'egreso';
export type PaymentCategory = 'servicio' | 'insumo' | 'alquiler' | 'marketing' | 'comisiones' | 'otro';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'yape_plin';
export type PaymentKind = 'reserva' | 'pago_completo' | 'pago_final';

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

export const PAYMENT_CATEGORY_LABELS: Record<PaymentCategory, string> = {
  servicio: 'Servicio',
  insumo: 'Insumo',
  alquiler: 'Alquiler',
  marketing: 'Marketing',
  comisiones: 'Comisiones',
  otro: 'Otro',
};

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

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

export type PriceType = 'fixed' | 'variable';

export interface Service {
  id: string;
  name: string;
  category_id: string;
  category?: Category;
  duration_min: number;
  price: number;
  price_type: PriceType;
  price_from: number | null;
  price_to: number | null;
  description: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  staff_services?: StaffService[];
}

export type ServiceInsert = Omit<Service, 'id' | 'created_at' | 'updated_at' | 'category' | 'staff_services'>;

export interface StaffSpecialty {
  id: string;
  staff_id: string;
  category_id: string;
  category?: Category;
  created_at: string;
}

export interface StaffService {
  id: string;
  staff_id: string;
  service_id: string;
  created_at: string;
  updated_at: string;
  staff?: StaffMember;
}

export interface CommissionDetail {
  appointment_service_id: string;
  appointment_id: string;
  service_id: string;
  artist_id: string | null;
  service_price: number;
  service_name: string;
  artist_name: string | null;
  artist_commission_pct: number | null;
  override_founder_fixed_amount: number | null;
  artist_role_name: string | null;
  artist_commission: number;
  founder_share: number;
}

export interface CommissionReportRow {
  artist_id: string | null;
  artist_name: string | null;
  artist_role_name: string | null;
  artist_role_color: string | null;
  total_services: number;
  total_service_revenue: number;
  total_artist_commission: number;
  total_founder_share: number;
}

 export interface StaffMember {
   id: string;
   name: string;
   phone: string | null;
   role_id: string;
   role?: { name: string; color: string };
   staff_specialties?: StaffSpecialty[];
   commission_pct: number;
   schedule: string | null;
   photo_url: string | null;
   active: boolean;
   last_commission_paid: string | null;
   birthday_date: string | null;
   created_at: string;
   updated_at: string;
   staff_stats?: {
     total_appointments: number;
     total_revenue: number;
     last_appointment: string | null;
   };
 }

export type StaffMemberInsert = Omit<StaffMember, 'id' | 'created_at' | 'updated_at' | 'staff_stats' | 'role' | 'staff_specialties'>;

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
  client?: { name: string; phone: string | null; instagram?: string | null };
  artist?: { name: string; photo_url: string | null };
  appointment_services?: Array<{
    id: string;
    service_id: string;
    artist_id: string | null;
    service_price: number | null;
    service: { name: string; price: number; duration_min: number; category_id: string; category?: Category };
    artist?: { name: string; photo_url: string | null };
    commission_detail?: CommissionDetail;
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

export function getCategoryName(service: Service | null | undefined): string {
  return service?.category?.name || 'Sin categoría';
}

export function getCategoryColor(service: Service | null | undefined): string {
  return service?.category?.color || '#6B7280';
}

export function getCategoryIcon(service: Service | null | undefined): string {
  return service?.category?.icon || '📋';
}

export function getStaffSpecialtyNames(staff: StaffMember | null | undefined): string[] {
  return staff?.staff_specialties?.flatMap(s => s.category?.name ? [s.category.name] : []) || [];
}

export function getCategoryIdsFromStaffSpecialties(staff: StaffMember | null | undefined): string[] {
  return staff?.staff_specialties?.flatMap(s => s.category_id ? [s.category_id] : []) || [];
}
