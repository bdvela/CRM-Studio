'use client';

import { memo } from 'react';
import type { AppointmentDetailNotesProps } from './types-detail';
import { FileText } from 'lucide-react';

export const AppointmentDetailNotes = memo(function AppointmentDetailNotes({ notes }: AppointmentDetailNotesProps) {
  if (!notes) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
          <FileText className="size-4 text-zinc-400" aria-hidden="true" />
          Notas
        </h3>
        <p className="text-sm text-zinc-600 italic border-l-2 border-zinc-200 pl-3 leading-relaxed">
          {notes}
        </p>
      </div>
    </div>
  );
});
