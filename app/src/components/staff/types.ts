'use client';

import type { StaffMember, Role, Category, Service, Appointment } from '@/types/database';

export type StaffModalTab = 'basicos' | 'especialidades' | 'comisiones';
export type Period = '7d' | '30d' | '90d';

export type StaffFormState = {
  name: string;
  phone: string | null;
  role_id: string;
  commission_pct: number;
  schedule: string | null;
  photo_url: string | null;
  active: boolean;
  last_commission_paid: string | null;
  birthday_date: string | null;
};

export type FormAction =
  | { type: 'UPDATE'; payload: Partial<StaffFormState> }
  | { type: 'SET'; payload: StaffFormState };

export interface StaffWithDetails extends StaffMember {}

export interface StaffPerformance {
  totalAppointments: number;
  totalRevenue: number;
  totalCommission: number;
  totalFounderShare: number;
  lastAppointmentDate: string | null;
}

export interface StaffTopService {
  service_id: string;
  name: string;
  count: number;
  revenue: number;
}

export interface CommissionOverrideWithService {
  id: string;
  staff_id: string;
  service_id: string;
  founder_fixed_amount: number;
  created_at: string;
  updated_at: string;
  service?: { name: string; price: number } | null;
}

export interface StaffCardProps {
  member: StaffWithDetails;
  onView: (member: StaffWithDetails) => void;
}

export interface StaffFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export interface StaffListContentProps {
  loading: boolean;
  members: StaffWithDetails[];
  search: string;
  onView: (member: StaffWithDetails) => void;
  onNew: () => void;
}

export interface StaffFormModalProps {
  open: boolean;
  onClose: () => void;
  editingMember: StaffWithDetails | null;
  form: StaffFormState;
  dispatch: React.Dispatch<FormAction>;
  roles: Role[];
  categories: Category[];
  services: Service[];
  specialtySelections: string[];
  setSpecialtySelections: React.Dispatch<React.SetStateAction<string[]>>;
  overrides: Record<string, number | null>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, number | null>>>;
  submitting: boolean;
  activeTab: StaffModalTab;
  setActiveTab: React.Dispatch<React.SetStateAction<StaffModalTab>>;
  initialForm: StaffFormState;
  initialSpecialties: string[];
  initialOverrides: Record<string, number | null>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isOwner: (member: StaffWithDetails | null) => boolean;
}

export interface StaffComisionesTabProps {
  isOwner: boolean;
  editingMember: StaffWithDetails | null;
  form: StaffFormState;
  dispatch: React.Dispatch<FormAction>;
  services: Service[];
  overrides: Record<string, number | null>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, number | null>>>;
}

export interface StaffDetailProfileProps {
  member: StaffWithDetails;
}

export interface StaffDetailStatsProps {
  performance: StaffPerformance | null;
  loading: boolean;
}

export interface StaffDetailTopServicesProps {
  services: StaffTopService[];
}

export interface StaffDetailDistributionProps {
  performance: StaffPerformance;
}

export interface StaffAppointmentHistoryProps {
  appointments: Appointment[];
}

export interface StaffDetailQuickInfoProps {
  member: StaffWithDetails;
  commissionOverridesCount?: number;
}

export const FORM_INIT: StaffFormState = {
  name: '',
  phone: '',
  role_id: '',
  commission_pct: 0,
  schedule: '',
  photo_url: null,
  active: true,
  last_commission_paid: null,
  birthday_date: null,
};

export function formReducer(state: StaffFormState, action: FormAction): StaffFormState {
  switch (action.type) {
    case 'UPDATE': return { ...state, ...action.payload };
    case 'SET': return action.payload;
    default: return state;
  }
}

export function isOwnerRoleName(roleName: string | null | undefined): boolean {
  if (!roleName) return false;
  const normalized = roleName.toLowerCase().trim();
  return normalized === 'dueña' || normalized === 'founder';
}

export function isOwnerMember(member: StaffWithDetails | null): boolean {
  if (!member) return false;
  return isOwnerRoleName(member.role?.name);
}
