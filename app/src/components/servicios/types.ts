import type { Service, ServiceInsert, Category, StaffMember, PriceType } from '@/types/database';

export interface ServiceForm extends Omit<ServiceInsert, 'price_type' | 'price_from' | 'price_to'> {
  price_type: PriceType;
  price_from: number | null;
  price_to: number | null;
}

export type FormAction =
  | { type: 'UPDATE'; payload: Partial<ServiceForm> }
  | { type: 'SET'; payload: ServiceForm };

export interface ServiciosDataState {
  services: Service[];
  categories: Category[];
  allStaff: StaffMember[];
  loading: boolean;
  error: string | null;
}

export interface ServiciosUIState {
  submitting: boolean;
  showModal: boolean;
  editingService: Service | null;
  deletingServiceId: string | null;
  search: string;
  categoryFilter: string;
  activeModalTab: string;
  selectedStaffIds: string[];
}

export interface ServiceCardProps {
  service: Service;
  onClick: (svc: Service) => void;
}

export interface ServiceFiltersProps {
  search: string;
  categoryFilter: string;
  onSearchChange: (v: string) => void;
  onCategoryFilterChange: (v: string) => void;
  filterOptions: { value: string; label: string }[];
}

export interface ServiceListContentProps {
  search: string;
  categoryFilter: string;
  onSearchChange: (v: string) => void;
  onCategoryFilterChange: (v: string) => void;
  filterOptions: { value: string; label: string }[];
  loading: boolean;
  error: string | null;
  filtered: Service[];
  grouped: Record<string, Service[]>;
  categories: Category[];
  onOpenNew: () => void;
  openEdit: (svc: Service) => void;
}

export interface ServicioStaffTabProps {
  allStaff: StaffMember[];
  categories: Category[];
  formCategoryId: string;
  selectedStaffIds: string[];
  onStaffToggle: (id: string) => void;
}

export interface ServicioFormModalProps {
  open: boolean;
  editingService: Service | null;
  form: ServiceForm;
  dispatch: React.Dispatch<FormAction>;
  activeModalTab: string;
  onActiveModalTabChange: (v: string) => void;
  selectedStaffIds: string[];
  deletingServiceId: string | null;
  submitting: boolean;
  allStaff: StaffMember[];
  categories: Category[];
  categoryOptions: { value: string; label: string }[];
  onClose: () => void;
  onCategoryChange: (id: string) => void;
  onStaffToggle: (id: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onDelete: () => Promise<void>;
  isFormValid: () => boolean;
  haveFormChanges: () => boolean;
}
