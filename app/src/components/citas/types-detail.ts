import type {
  AppointmentStatus,
} from '@/types/database';
import type { AppointmentWithDetails } from './types';

export interface AppointmentDetailHeaderProps {
  appointment: AppointmentWithDetails;
  onEdit: () => void;
  onCancel: () => void;
  onAdvanceStatus: () => void;
  onMarkAsNoShow: () => void;
  onGoToClient: (clientId: string) => void;
}

export interface AppointmentDetailBalanceProps {
  appointment: AppointmentWithDetails;
}

export interface AppointmentDetailActionsProps {
  appointment: AppointmentWithDetails;
  onEdit: () => void;
  onCancel: () => void;
  onAdvanceStatus: () => void;
  onMarkAsNoShow: () => void;
}

export interface AppointmentDetailNotesProps {
  notes: string | null;
}
