'use client';

import type { StaffOccupancyDTO } from './types';

interface Props {
  staff: StaffOccupancyDTO[];
}

function capacityColor(pct: number) {
  if (pct < 30) return 'bg-emerald-400';
  if (pct < 60) return 'bg-amber-400';
  return 'bg-rose-400';
}

export function StaffOccupancy({ staff }: Props) {
  if (staff.length < 2) return null;

  return (
    <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-50">
        <h2 className="text-base font-semibold text-zinc-900">Ocupación del staff</h2>
        <p className="text-xs text-zinc-400">Citas asignadas hoy</p>
      </div>
      <div className="p-4 space-y-3">
        {staff.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <div className="w-24 flex-shrink-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{member.name}</p>
            </div>
            <div className="flex-1">
              <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${capacityColor(member.capacityPercent)}`}
                  style={{ width: `${Math.min(member.capacityPercent, 100)}%` }}
                />
              </div>
            </div>
            <div className="w-16 text-right flex-shrink-0">
              <span className="text-xs font-medium text-zinc-500">
                {member.appointmentCount} cita{member.appointmentCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
