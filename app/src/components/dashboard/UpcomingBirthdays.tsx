'use client';

import { Cake } from 'lucide-react';
import type { BirthdayItem } from './types';

interface Props {
  birthdays: BirthdayItem[];
}

function label(daysLeft: number, isToday: boolean) {
  if (isToday) return 'Hoy';
  if (daysLeft === 1) return 'Mañana';
  return `En ${daysLeft} días`;
}

export function UpcomingBirthdays({ birthdays }: Props) {
  if (birthdays.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-50 flex items-center gap-2">
        <div className="size-8 rounded-lg bg-pink-50 flex items-center justify-center">
          <Cake className="size-4 text-pink-500" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Próximos cumpleaños</h2>
          <p className="text-xs text-zinc-400">Para un saludo bonito a tiempo</p>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {birthdays.map((birthday) => (
          <div key={birthday.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-pink-50/60">
            <div className="size-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {birthday.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 truncate">{birthday.name}</p>
              <p className="text-xs text-zinc-500">{label(birthday.days_left, birthday.is_today)}</p>
            </div>
            <span className="text-xs font-medium text-pink-600 bg-white px-2 py-1 rounded-full border border-pink-100 flex-shrink-0" suppressHydrationWarning>
              {new Date(birthday.next_birthday).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
