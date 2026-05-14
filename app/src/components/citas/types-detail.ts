import type {
  AppointmentStatus,
} from '@/types/database';
import type { AppointmentWithDetails } from './types';

export interface AppointmentDetailHeaderProps {
  appointment: AppointmentWithDetails;
  onBack: () => void;
  onEdit: () => void;
  onGoToClient: (clientId: string) => void;
}

export interface AppointmentDetailStepperProps {
  status: AppointmentStatus;
}

export interface AppointmentDetailScheduleProps {
  appointment: AppointmentWithDetails;
}

export interface AppointmentDetailServicesProps {
  appointment: AppointmentWithDetails;
  onGoToStaff?: (staffId: string) => void;
}

export interface AppointmentDetailCommissionsProps {
  appointment: AppointmentWithDetails;
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
