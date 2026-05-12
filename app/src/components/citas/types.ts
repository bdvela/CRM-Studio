import type { AppointmentInsert, Client, Service, StaffMember } from '@/types/database';

type ListFilter = 'list' | 'day' | 'week';
export type ViewMode = 'list' | 'calendar';

export interface DetailPopoverProps {
  show: boolean;
  selectedAppt: any;
  statusColors: Record<string, 'info' | 'warning' | 'success' | 'danger'>;
  onClose: () => void;
  onEdit: (appt: any) => void;
  onCancel: (appt: any) => void;
  onAdvanceStatus: (appt: any) => void;
  onMarkAsNoShow: (appt: any) => void;
}

export interface ServiceConfigModalContentProps {
  open: boolean;
  serviceId: string | null;
  services: Service[];
  staff: StaffMember[];
  currentArtistId: string;
  currentPrice: number | null;
  onSave: (config: { serviceId: string; artistId: string; price: number | null }) => void;
  onRemove: (serviceId: string) => void;
  onClose: () => void;
}

export interface ServiceSelectorModalContentProps {
  open: boolean;
  services: Service[];
  staff: StaffMember[];
  initialSelectedIds: string[];
  initialArtists: Record<string, string>;
  initialPrices: Record<string, number>;
  onConfirm: (config: { selectedIds: string[]; artists: Record<string, string>; prices: Record<string, number> }) => void;
  onClose: () => void;
}

export interface CitasToolbarProps {
  viewMode: ViewMode;
  listFilter: ListFilter;
  filterArtist: string;
  filterStatus: string;
  staff: StaffMember[];
  appointments: any[];
  onViewModeChange: (mode: ViewMode) => void;
  onListFilterChange: (filter: ListFilter) => void;
  onFilterArtistChange: (artistId: string) => void;
  onFilterStatusChange: (status: string) => void;
  onClearFilters: () => void;
}

export interface AppointmentCardProps {
  appt: any;
  statusColors: Record<string, 'info' | 'warning' | 'success' | 'danger'>;
  onSelect: (appt: any) => void;
}

export interface AppointmentFormModalContentProps {
  open: boolean;
  editingAppt: any;
  form: AppointmentFormData;
  clients: Client[];
  selectedServices: string[];
  serviceArtists: Record<string, string>;
  customPrices: Record<string, number>;
  services: Service[];
  staff: StaffMember[];
  overlapWarning: string | null;
  advancePaid: boolean;
  submitting: boolean;
  canDelete: boolean;
  totalDuration: number;
  haveChanges: () => boolean;
  calculateTotalPrice: () => number;
  onFormChange: (updates: Partial<AppointmentFormData>) => void;
  onStartTimeChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onClose: () => void;
  onOpenServiceSelector: () => void;
  onOpenServiceConfig: (serviceId: string) => void;
  onToggleAdvancePaid: () => void;
}

export interface AppointmentFormData {
  client_id: string;
  start_time: string;
  status: AppointmentInsert['status'];
  notes: string;
  color: string;
}

export type DataState = {
  appointments: any[];
  staff: StaffMember[];
  services: Service[];
  clients: Client[];
  loading: boolean;
  submitting: boolean;
};

export type DataAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_COMPLETE'; appointments: any[]; staff: StaffMember[]; services: Service[]; clients: Client[] }
  | { type: 'SET_APPOINTMENTS'; appointments: any[] }
  | { type: 'SET_SUBMITTING'; submitting: boolean };

export type UiState = {
  viewMode: ViewMode;
  listFilter: ListFilter;
  filterArtist: string;
  filterStatus: string;
  showModal: boolean;
  showDetail: boolean;
  showServiceConfig: boolean;
  showServiceSelector: boolean;
  overlapWarning: string | null;
  pendingDate: Date | null;
  advancePaid: boolean;
};

export type UiAction =
  | { type: 'SET_VIEW_MODE'; viewMode: ViewMode }
  | { type: 'SET_LIST_FILTER'; listFilter: ListFilter }
  | { type: 'SET_FILTER_ARTIST'; filterArtist: string }
  | { type: 'SET_FILTER_STATUS'; filterStatus: string }
  | { type: 'SET_SHOW_MODAL'; showModal: boolean }
  | { type: 'SET_SHOW_DETAIL'; showDetail: boolean }
  | { type: 'SET_SHOW_SERVICE_CONFIG'; showServiceConfig: boolean }
  | { type: 'SET_SHOW_SERVICE_SELECTOR'; showServiceSelector: boolean }
  | { type: 'SET_OVERLAP_WARNING'; overlapWarning: string | null }
  | { type: 'SET_PENDING_DATE'; pendingDate: Date | null }
  | { type: 'SET_ADVANCE_PAID'; advancePaid: boolean }
  | { type: 'CLEAR_FILTERS' };
