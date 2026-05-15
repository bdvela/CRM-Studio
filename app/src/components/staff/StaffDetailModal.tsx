'use client';

import { memo, useMemo } from 'react';
import type { StaffWithDetails, StaffPerformance } from './types';
import { isOwnerMember } from './types';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CalendarDays, DollarSign, TrendingUp, Clock, Phone,
  Pencil, Cake, MessageCircle, Sparkles, ArrowUpRight,
} from 'lucide-react';

interface StaffDetailModalProps {
  open: boolean;
  member: StaffWithDetails | null;
  onClose: () => void;
  onEdit: (member: StaffWithDetails) => void;
  commissionOverridesCount?: number;
  recentPerformance?: StaffPerformance | null;
}

function waUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/51${digits}`;
}

function birthdayLabel(birthdayDate: string | null): { label: string; isSoon: boolean } | null {
  if (!birthdayDate) return null;
  const bd = new Date(birthdayDate);
  const now = new Date();
  const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
  if (thisYearBd < now) thisYearBd.setFullYear(thisYearBd.getFullYear() + 1);
  const daysUntil = Math.ceil((thisYearBd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = formatDate(birthdayDate);
  if (daysUntil <= 7) return { label: `${formatted} — Próximo`, isSoon: true };
  return { label: formatted, isSoon: false };
}

// ─── Decorative elements ──────────────────────────────────────────────────

function Dot() {
  return <span className="text-rose-300/60 mx-2 select-none" aria-hidden="true">·</span>;
}

function ThinDivider() {
  return <div className="w-full h-px bg-gradient-to-r from-transparent via-rose-200/50 to-transparent my-1" />;
}

// ─── Color utilities ─────────────────────────────────────────────────────

const avatarGradients = [
  'from-rose-400 via-pink-400 to-rose-300',
  'from-violet-400 via-purple-400 to-fuchsia-300',
  'from-amber-400 via-orange-400 to-rose-300',
  'from-emerald-400 via-teal-400 to-cyan-300',
  'from-blue-400 via-indigo-400 to-violet-300',
];

function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

// ─── Component ────────────────────────────────────────────────────────────

export const StaffDetailModal = memo(function StaffDetailModal({
  open,
  member,
  onClose,
  onEdit,
  commissionOverridesCount = 0,
  recentPerformance,
}: StaffDetailModalProps) {
  const roleColor = member?.role?.color || '#a78bfa';
  const stats = member?.staff_stats;
  const bd = useMemo(() => birthdayLabel(member?.birthday_date ?? null), [member?.birthday_date]);

  if (!member) return null;

  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="relative overflow-hidden rounded-xl bg-white">

        {/* ─── Header section ─── */}
        <div className="relative pt-6 pb-4 px-5">
          {/* Decorative sparkle */}
          <Sparkles className="absolute top-4 right-4 size-5 text-rose-300/40" aria-hidden="true" />

          {/* Avatar — large, floating, with decorative ring */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div
                className="size-20 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-rose-200/40"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${roleColor}dd, ${roleColor}88, ${roleColor})`,
                }}
                role="img"
                aria-label={`Foto de ${member.name}`}
              >
                {member.name[0]?.toUpperCase()}
              </div>
              {/* Decorative ring */}
              <div className="absolute -inset-1 rounded-full border-2 border-dashed border-rose-300/30 animate-spin" style={{ animationDuration: '20s' }} aria-hidden="true" />
            </div>
          </div>

          {/* Name + role */}
          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-zinc-800">
              {member.name}
            </h2>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="custom" color={roleColor} className="text-[11px] px-2.5 py-0.5">
                {member.role?.name || 'Sin rol'}
              </Badge>
              {!member.active && (
                <Badge variant="danger" className="text-[11px] px-2.5 py-0.5">Inactivo</Badge>
              )}
            </div>
          </div>
        </div>

        {/* ─── Stats row — elegant horizontal flow ─── */}
        {stats && (
          <div className="px-5 pb-5">
            <div className="flex items-center justify-center gap-1 text-center">
              <div className="flex-1">
                <p className="text-2xl font-bold text-zinc-800 tabular-nums">{stats.total_appointments}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 tracking-wide uppercase">Citas</p>
              </div>
              <Dot />
              <div className="flex-1">
                <p className="text-xl font-bold text-zinc-800 tabular-nums">{formatCurrency(stats.total_revenue)}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 tracking-wide uppercase">Facturado</p>
                {recentPerformance && recentPerformance.totalRevenue > 0 && (
                  <p className="text-[10px] text-rose-400 mt-0.5 flex items-center justify-center gap-1">
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                    30d: {formatCurrency(recentPerformance.totalRevenue)}
                  </p>
                )}
              </div>
              <Dot />
              <div className="flex-1">
                <p className="text-2xl font-bold text-rose-500 tabular-nums">{member.commission_pct}%</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 tracking-wide uppercase">Comision</p>
                {commissionOverridesCount > 0 && (
                  <p className="text-[10px] text-amber-500 font-medium mt-0.5">
                    {commissionOverridesCount} excepcion{commissionOverridesCount !== 1 ? 'es' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <ThinDivider />

        {/* ─── Info cards — 2-column refined grid ─── */}
        <div className="px-4 py-4 grid grid-cols-2 gap-2">
          {/* Phone + WhatsApp */}
          {member.phone && (
            <div className="group flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/60 transition-colors">
              <div className="size-8 rounded-lg bg-rose-100/60 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
                <Phone className="size-3.5 text-rose-400" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-zinc-400 mb-0.5">Telefono</p>
                <p className="text-xs font-medium text-zinc-700 truncate">{member.phone}</p>
              </div>
            </div>
          )}

          {/* WhatsApp button — paired with phone in same row */}
          {member.phone && (
            <div className="flex items-center justify-end px-3 py-2.5">
              <a
                href={waUrl(member.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-xs font-medium text-emerald-700 transition-colors"
                aria-label={`Enviar WhatsApp a ${member.name}`}
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </a>
            </div>
          )}

          {/* Birthday */}
          {bd && (
            <div className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${bd.isSoon ? 'bg-rose-50/80 border border-rose-100' : 'hover:bg-white/60'}`}>
              <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bd.isSoon ? 'bg-rose-200' : 'bg-rose-100/60 group-hover:bg-rose-100'} transition-colors`}>
                <Cake className={`size-3.5 ${bd.isSoon ? 'text-rose-600' : 'text-rose-400'}`} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-400 mb-0.5">Cumpleaños</p>
                <p className={`text-xs font-medium truncate ${bd.isSoon ? 'text-rose-700' : 'text-zinc-700'}`}>
                  {bd.label}
                </p>
              </div>
              {bd.isSoon && <span className="text-[10px] bg-rose-200 text-rose-700 px-1.5 py-0.5 rounded-full flex-shrink-0 ml-auto">hoy?</span>}
            </div>
          )}

          {/* Schedule */}
          {member.schedule && (
            <div className="group flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/60 transition-colors">
              <div className="size-8 rounded-lg bg-violet-100/60 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                <Clock className="size-3.5 text-violet-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-400 mb-0.5">Horario</p>
                <p className="text-xs font-medium text-zinc-700 truncate">{member.schedule}</p>
              </div>
            </div>
          )}

          {/* Last appointment */}
          {stats?.last_appointment && (
            <div className="group flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/60 transition-colors">
              <div className="size-8 rounded-lg bg-sky-100/60 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 transition-colors">
                <CalendarDays className="size-3.5 text-sky-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-400 mb-0.5">Ultima cita</p>
                <p className="text-xs font-medium text-zinc-700 truncate">{formatDate(stats.last_appointment)}</p>
              </div>
            </div>
          )}

          {/* Specialties — visual cloud */}
          {member.staff_specialties && member.staff_specialties.length > 0 && (
            <div className="group flex items-start gap-2 px-3 py-2.5 rounded-xl hover:bg-white/60 transition-colors col-span-2">
              <div className="size-8 rounded-lg bg-amber-100/60 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-amber-100 transition-colors">
                <Sparkles className="size-3.5 text-amber-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-zinc-400 mb-1.5">Especialidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {member.staff_specialties.map((spec) => (
                    <span
                      key={spec.id || spec.category_id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors"
                      style={{
                        backgroundColor: `${spec.category?.color || '#e2e8f0'}18`,
                        color: spec.category?.color || '#64748b',
                        border: `1px solid ${spec.category?.color || '#e2e8f0'}30`,
                      }}
                    >
                      {spec.category?.icon || ''} {spec.category?.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filler cells to maintain grid when items are missing */}
          {!member.phone && !bd && !member.schedule && !stats?.last_appointment && (
            <div className="col-span-2 text-center py-4">
              <p className="text-xs text-zinc-300">Sin informacion adicional</p>
            </div>
          )}
        </div>

        <ThinDivider />

        {/* ─── Actions ─── */}
        <div className="px-4 py-4 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-zinc-200/80 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 rounded-xl py-5 text-sm font-medium transition-all duration-200"
            onClick={onClose}
          >
            Cerrar
          </Button>
          {!isOwnerMember(member) && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(member);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-rose-200/40 active:scale-[0.97]"
              style={{ background: `linear-gradient(135deg, ${roleColor}cc, ${roleColor})` }}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </button>
          )}
        </div>

      </div>
    </Modal>
  );
});
