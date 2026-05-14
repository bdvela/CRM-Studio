'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

const DAY_CAPACITY_MINUTES = 12 * 60;

function getOccupancyColor(pct: number) {
  if (pct < 40) return 'bg-emerald-400';
  if (pct < 75) return 'bg-amber-400';
  return 'bg-rose-400';
}

export function WelcomeBanner({ todayAppointments }: { todayAppointments: { total_duration_min: number }[] }) {
  const { headline, detail, capacityPercent } = useMemo(() => {
    const bookedMinutes = todayAppointments.reduce(
      (sum, appt) => sum + Number(appt.total_duration_min || 0), 0
    );
    const pct = bookedMinutes > 0
      ? Math.min(100, Math.round((bookedMinutes / DAY_CAPACITY_MINUTES) * 100))
      : 0;
    const count = todayAppointments.length;

    let h = 'Hoy viene suave';
    let d = 'Aprovecha para avanzar con seguimiento y organización.';

    if (count === 0) {
      h = 'Hoy tienes el día libre';
      d = 'Perfecto para ordenar pendientes y preparar la semana.';
    } else if (count === 1) {
      h = 'Tienes 1 clienta programada';
      d = `Tu estudio va al ${pct}% de capacidad estimada hoy.`;
    } else {
      h = `Hoy tienes ${count} clientas programadas`;
      d = `Tu estudio va al ${pct}% de capacidad estimada hoy.`;
    }

    return { headline: h, detail: d, capacityPercent: pct };
  }, [todayAppointments]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-salon-600 via-salon-700 to-accent-800 p-6 md:p-8 text-white">
      <div className="absolute top-0 right-0 size-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 size-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="size-5 text-salon-200" />
          <span className="text-sm font-medium text-salon-200">Panel de control</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{headline}</h2>
        <p className="text-salon-200 mt-2 text-sm md:text-base max-w-lg">{detail}</p>
        {todayAppointments.length > 0 && (
          <div className="mt-4 max-w-xs">
            <div className="flex items-center justify-between text-xs text-salon-200 mb-1">
              <span>Capacidad del día</span>
              <span>{capacityPercent}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-out ${getOccupancyColor(capacityPercent)}`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
