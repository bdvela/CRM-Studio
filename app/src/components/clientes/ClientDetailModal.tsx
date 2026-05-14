'use client';

import type { ClientDetailModalProps } from './types';
import { STATUS_LABELS, STATUS_BADGE_VARIANT } from './constants';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { CalendarDays, DollarSign, Clock, Phone, Mail, Instagram, Trash2, Edit, ExternalLink } from 'lucide-react';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { APPT_STATUS_STYLES } from './constants';

function instagramUrl(handle: string): string {
  const cleaned = handle.replace(/^@/, '');
  return `https://instagram.com/${cleaned}`;
}

export function ClientDetailModal({
  open,
  client,
  appointments,
  onClose,
  onEdit,
  onDelete,
  onViewDetail,
  deleting,
}: ClientDetailModalProps) {
  if (!client) return null;

  const latestAppt = appointments[0];

  return (
    <Modal open={open} onClose={onClose} title="Detalle de clienta">
      <div className="space-y-5 sm:space-y-6">
          {/* Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className="size-14 sm:size-16 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-rose-600 font-bold text-xl sm:text-2xl shadow-inner ring-4 ring-white"
              aria-label={`Inicial de ${client.name}`}
              role="img"
            >
              {client.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 truncate">{client.name}</h3>
              <Badge variant={STATUS_BADGE_VARIANT[client.status]} className="mt-1.5 text-xs">
                {STATUS_LABELS[client.status]}
              </Badge>
            </div>
          </div>

          {/* Contact */}
          {(client.phone || client.email || client.instagram) && (
            <div className="space-y-1.5 sm:space-y-2 py-1">
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-zinc-50 transition-colors group">
                  <div className="size-8 sm:size-9 rounded-lg bg-zinc-100 flex items-center justify-center group-hover:bg-salon-100 transition-colors">
                    <Phone className="size-3.5 sm:size-4 text-zinc-400 group-hover:text-salon-500" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-zinc-400">Teléfono</p>
                    <p className="text-xs sm:text-sm font-medium text-zinc-700">{client.phone}</p>
                  </div>
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-zinc-50 transition-colors group">
                  <div className="size-8 sm:size-9 rounded-lg bg-zinc-100 flex items-center justify-center group-hover:bg-salon-100 transition-colors">
                    <Mail className="size-3.5 sm:size-4 text-zinc-400 group-hover:text-salon-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-zinc-400">Email</p>
                    <p className="text-xs sm:text-sm font-medium text-zinc-700 truncate">{client.email}</p>
                  </div>
                </a>
              )}
              {client.instagram && (
                <a href={instagramUrl(client.instagram)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-zinc-50 transition-colors group">
                  <div className="size-8 sm:size-9 rounded-lg bg-zinc-100 flex items-center justify-center group-hover:bg-salon-100 transition-colors">
                    <Instagram className="size-3.5 sm:size-4 text-zinc-400 group-hover:text-salon-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-zinc-400">Instagram</p>
                    <p className="text-xs sm:text-sm font-medium text-zinc-700 truncate">{client.instagram}</p>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Stats */}
          {client.client_stats && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3 sm:p-4 rounded-xl bg-zinc-50 text-center">
                <CalendarDays className="size-4 sm:size-5 mx-auto text-salon-500 mb-1.5 sm:mb-2" />
                <p className="text-lg sm:text-xl font-bold text-zinc-900">{client.client_stats.total_appointments}</p>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-1">Citas</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-zinc-50 text-center">
                <DollarSign className="size-4 sm:size-5 mx-auto text-green-500 mb-1.5 sm:mb-2" />
                <p className="text-base sm:text-lg font-bold text-zinc-900">{formatCurrency(client.client_stats.total_spent)}</p>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-1">Total</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-zinc-50 text-center">
                <Clock className="size-4 sm:size-5 mx-auto text-accent-500 mb-1.5 sm:mb-2" />
                <p className="text-xs sm:text-sm font-bold text-zinc-900">
                  {client.client_stats.last_visit ? formatDate(client.client_stats.last_visit) : '—'}
                </p>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-1">Última</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div className="p-3 sm:p-4 rounded-xl bg-amber-50/50 border border-amber-100">
              <div className="flex items-start gap-2">
                <svg className="size-3.5 sm:size-4 text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
                <p className="text-xs sm:text-sm text-amber-800 leading-relaxed break-words whitespace-pre-wrap min-w-0">{client.notes}</p>
              </div>
            </div>
          )}

          {/* Latest Appointment */}
          <div>
            <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
              <CalendarDays className="size-3.5 sm:size-4 text-zinc-400" />
              <h4 className="text-xs sm:text-sm font-semibold text-zinc-900">Última cita</h4>
            </div>
            {!latestAppt ? (
              <div className="text-center py-6 sm:py-8 px-4 rounded-xl bg-zinc-50">
                <CalendarDays className="size-6 sm:size-8 mx-auto text-zinc-300 mb-2" />
                <p className="text-xs sm:text-sm text-zinc-400">Sin citas registradas</p>
              </div>
            ) : (
              <div className="p-2.5 sm:p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                  <p className="font-medium text-xs sm:text-sm text-zinc-900 flex-1 min-w-0 truncate">{latestAppt.title}</p>
                  <p className="text-xs sm:text-sm font-semibold text-zinc-900 flex-shrink-0">{formatCurrency(latestAppt.total_price)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-zinc-400">
                    <span>{formatDate(latestAppt.start_time)}</span>
                    <span>·</span>
                    <span>{formatTime(latestAppt.start_time)}</span>
                    {latestAppt.artist && (
                      <>
                        <span>·</span>
                        <span>{latestAppt.artist.name}</span>
                      </>
                    )}
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${APPT_STATUS_STYLES[latestAppt.status] || ''} flex-shrink-0`}>
                    {APPOINTMENT_STATUS_LABELS[latestAppt.status]}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3 pt-2 border-t border-zinc-100">
            <Button type="button" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={onDelete} loading={deleting}>
              <Trash2 className="size-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">{deleting ? 'Eliminando...' : 'Eliminar'}</span>
              <span className="sm:hidden">{deleting ? '...' : 'Eliminar'}</span>
            </Button>
            <Button type="button" className="flex-1" onClick={onEdit}>
              <Edit className="size-4 mr-1.5 sm:mr-2" />
              Editar
            </Button>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={onViewDetail}>
            <ExternalLink className="size-4 mr-1.5" />
            Ver detalle completo
          </Button>
        </div>
    </Modal>
  );
}
