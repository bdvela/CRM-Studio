import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Service, StaffMember, StaffService, StaffSpecialty } from '@/types/database';

export function formatDetailDate(startTime: string): string {
  return format(new Date(startTime), "EEEE d 'de' MMMM", { locale: es });
}

export function getServiceEmoji(appt: any): string {
  const svc = appt.appointment_services?.[0]?.service;
  return svc?.category?.icon || '📋';
}

export function toLocalISO(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function generateAppointmentTitle(selectedServiceIds: string[], allServices: Service[]): string {
  const selected = allServices.filter((s) => selectedServiceIds.includes(s.id));
  if (selected.length === 0) return 'Cita';
  const names = selected.map((s) => s.name);
  if (names.length <= 3) return names.join(' + ');
  return `${names[0]} + ${names.length - 1} más`;
}

export function getAvailableArtistsForService(
  serviceId: string,
  categoryId: string | null | undefined,
  staff: StaffMember[],
  services: Service[]
): StaffMember[] {
  const svc = services.find(s => s.id === serviceId);
  const hasExplicitStaff = svc?.staff_services && svc.staff_services.length > 0;

  if (hasExplicitStaff) {
    const assignedIds = (svc.staff_services || []).map((ss: StaffService) => ss.staff_id);
    return staff.filter(s => s.active && assignedIds.includes(s.id));
  }

  if (categoryId) {
    return staff.filter(s =>
      s.active && (s.staff_specialties || []).some(
        (sp: StaffSpecialty) => sp.category_id === categoryId
      )
    );
  }

  return staff.filter(s => s.active);
}
