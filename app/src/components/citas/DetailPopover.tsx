'use client';

import { AppointmentTicket } from './AppointmentTicket';
import type { AppointmentWithDetails } from './types';

interface DetailPopoverProps {
  show: boolean;
  selectedAppt: AppointmentWithDetails | null;
  statusColors?: Record<string, string>;
  onClose: () => void;
  onEdit: (appt: AppointmentWithDetails) => void;
  onCancel: (appt: AppointmentWithDetails) => void;
  onAdvanceStatus?: (appt: AppointmentWithDetails) => void;
  onMarkAsNoShow?: (appt: AppointmentWithDetails) => void;
  onViewDetail?: (appt: AppointmentWithDetails) => void;
}

export function DetailPopover({
  show, selectedAppt, onClose, onEdit, onCancel, onAdvanceStatus, onMarkAsNoShow, onViewDetail,
}: DetailPopoverProps) {
  if (!show || !selectedAppt) return null;

  return (
    <AppointmentTicket
      appt={selectedAppt}
      onClose={onClose}
      onEdit={onEdit}
      onCancel={onCancel}
      onAdvanceStatus={onAdvanceStatus}
      onMarkAsNoShow={onMarkAsNoShow}
      onViewDetail={onViewDetail}
    />
  );
}
