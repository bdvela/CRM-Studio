import { isBefore, startOfDay } from 'date-fns';
import type { AppointmentWithDetails } from './types';

type ApptColor = { bg: string; border: string; text: string; solid: string };

const APPT_COLORS: Record<string, ApptColor> = {
  rose:    { bg: 'bg-rose-100',    border: 'border-rose-300',    text: 'text-rose-700',    solid: 'bg-rose-500' },
  violet:  { bg: 'bg-violet-100',  border: 'border-violet-300',  text: 'text-violet-700',  solid: 'bg-violet-500' },
  blue:    { bg: 'bg-blue-100',    border: 'border-blue-300',    text: 'text-blue-700',    solid: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', solid: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-100',   border: 'border-amber-300',   text: 'text-amber-700',   solid: 'bg-amber-500' },
  cyan:    { bg: 'bg-cyan-100',    border: 'border-cyan-300',    text: 'text-cyan-700',    solid: 'bg-cyan-500' },
  pink:    { bg: 'bg-pink-100',    border: 'border-pink-300',    text: 'text-pink-700',    solid: 'bg-pink-500' },
  teal:    { bg: 'bg-teal-100',    border: 'border-teal-300',    text: 'text-teal-700',    solid: 'bg-teal-500' },
  red:     { bg: 'bg-red-100',     border: 'border-red-300',     text: 'text-red-700',     solid: 'bg-red-500' },
  orange:  { bg: 'bg-orange-100',  border: 'border-orange-300',  text: 'text-orange-700',  solid: 'bg-orange-500' },
  indigo:  { bg: 'bg-indigo-100',  border: 'border-indigo-300',  text: 'text-indigo-700',  solid: 'bg-indigo-500' },
};

const DEFAULT_COLOR: ApptColor = { bg: 'bg-salon-100', border: 'border-salon-300', text: 'text-salon-700', solid: 'bg-salon-500' };
const DEAD_COLOR: ApptColor = { bg: 'bg-zinc-100', border: 'border-zinc-200', text: 'text-zinc-400', solid: 'bg-zinc-400' };
export const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

export function isPastCalendarDay(day: Date, now: Date) {
  return isBefore(startOfDay(day), startOfDay(now));
}

export function getApptColor(appt: AppointmentWithDetails, now?: Date): ApptColor {
  const isDead = appt.status === 'cancelada' || appt.status === 'no_show';
  const isFaded = appt.status === 'completada' || (
    !isDead && new Date(appt.end_time || appt.start_time) < (now || new Date())
  );
  if (isDead || isFaded) return DEAD_COLOR;
  if (appt.color && APPT_COLORS[appt.color]) return APPT_COLORS[appt.color];
  return DEFAULT_COLOR;
}
