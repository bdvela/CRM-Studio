'use client';

import type { ReactivationClientDTO } from './types';

const avatarColors = [
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

interface Props {
  clients: ReactivationClientDTO[];
}

export function ReactivationWidget({ clients }: Props) {
  if (clients.length === 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-salon-50 border border-violet-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-violet-100/50">
        <h2 className="text-base font-semibold text-violet-900">Clientas por reactivar</h2>
        <p className="text-xs text-violet-600/70">{clients.length} sin visitas recientes</p>
      </div>
      <div className="p-4 space-y-2">
        {clients.slice(0, 3).map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-1.5">
            <div className={`size-8 rounded-full bg-gradient-to-br ${getAvatarColor(c.name || '?')} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {(c.name || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-violet-900 truncate">{c.name}</p>
              <p className="text-xs text-violet-600/70 truncate">{c.phone || c.instagram || 'Sin contacto'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
