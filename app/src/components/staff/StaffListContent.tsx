'use client';

import type { StaffListContentProps } from './types';
import { StaffCard } from './StaffCard';
import { Card } from '@/components/ui/card';
import { UserRound, Plus } from 'lucide-react';

export function StaffListContent({
  loading,
  members,
  search,
  onView,
  onNew,
}: StaffListContentProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Cargando miembros del staff">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={`skel-${n}`} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="py-5 px-5 space-y-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-full bg-zinc-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-zinc-100 rounded" />
                  <div className="h-4 w-1/2 bg-zinc-100 rounded" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <div className="h-5 w-20 bg-zinc-100 rounded-full" />
                <div className="h-5 w-16 bg-zinc-100 rounded-full" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <div className="h-4 w-24 bg-zinc-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center text-zinc-400 px-5" role="status" aria-live="polite">
          <UserRound className="size-12 mx-auto mb-3 opacity-30" aria-hidden="true" />
          <p className="text-sm">
            {search ? 'No hay miembros del staff que coincidan' : 'No hay miembros del staff registrados'}
          </p>
          {!search && (
            <button
              onClick={onNew}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-salon-600 hover:text-salon-700 transition-colors"
            >
              <Plus className="size-4" />
              Registrar primer miembro
            </button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite" aria-label="Lista de miembros del staff">
      {members.map((member, i) => (
        <div key={member.id} className="animate-fadeInUp" style={{ animationDelay: `${Math.min(i * 50, 300)}ms`, opacity: 0 }}>
          <StaffCard member={member} onView={onView} />
        </div>
      ))}
    </div>
  );
}
