import type {
  Client,
  ClientInsert,
  ClientStatus,
  Appointment,
} from '@/types/database';

export type ClientWithStats = Client;

export type StatusFilter = ClientStatus | 'all';

export interface ClientCardProps {
  client: ClientWithStats;
  onClick: () => void;
}

export interface ClientFiltersProps {
  search: string;
  statusFilter: StatusFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
}

export interface ClientListContentProps {
  loading: boolean;
  clients: ClientWithStats[];
  statusFilter: StatusFilter;
  search: string;
  onClientClick: (client: ClientWithStats) => void;
  onShowMore: () => void;
  visibleCount: number;
  totalVisible: number;
}

export interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ClientInsert) => Promise<void>;
  initialData?: ClientInsert;
  title?: string;
  submitting?: boolean;
}

export interface ClientDetailModalProps {
  open: boolean;
  client: ClientWithStats | null;
  appointments: Appointment[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onViewDetail: () => void;
  deleting: boolean;
}

export interface ClientDetailProfileProps {
  client: ClientWithStats;
}

export interface ClientDetailStatsProps {
  totalAppointments: number;
  totalSpent: number;
  lastVisit: string | null;
}

export interface ClientAppointmentHistoryProps {
  appointments: Appointment[];
  maxItems?: number;
}

export type ClientesUIState = {
  clients: ClientWithStats[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  showCreateModal: boolean;
  showDetailModal: boolean;
  viewingClient: ClientWithStats | null;
  editingClient: ClientWithStats | null;
  clientAppointments: Appointment[];
  search: string;
  statusFilter: StatusFilter;
  saving: boolean;
  deleting: boolean;
  visibleCount: number;
};

export type ClientesUIAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_CLIENTS'; clients: ClientWithStats[] }
  | { type: 'SET_SUBMITTING'; submitting: boolean }
  | { type: 'SET_SHOW_CREATE_MODAL'; show: boolean }
  | { type: 'SET_SHOW_DETAIL_MODAL'; show: boolean }
  | { type: 'SET_VIEWING_CLIENT'; client: ClientWithStats | null; appointments?: Appointment[] }
  | { type: 'SET_EDITING_CLIENT'; client: ClientWithStats | null }
  | { type: 'SET_SEARCH'; search: string }
  | { type: 'SET_STATUS_FILTER'; status: StatusFilter }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_DELETING'; deleting: boolean }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'SET_VISIBLE_COUNT'; count: number }
  | { type: 'RESET' };
