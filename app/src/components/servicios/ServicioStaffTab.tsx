'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { getCategoryIdsFromStaffSpecialties } from '@/types/database';
import type { ServicioStaffTabProps } from './types';

export const ServicioStaffTab = memo(function ServicioStaffTab({
  allStaff,
  categories,
  formCategoryId,
  selectedStaffIds,
  onStaffToggle,
}: ServicioStaffTabProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <span className="text-sm font-medium text-zinc-700">
          Artistas que brindan este servicio
        </span>
        <p className="text-xs text-zinc-400">
          Pre-seleccionados seg&uacute;n la categor&iacute;a. Puedes marcar/desmarcar cualquiera.
        </p>
      </div>

      {allStaff.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-4">No hay staff registrado</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1" role="group" aria-label="Selección de artistas">
          {allStaff.map((staff) => {
            const hasSpecialty = getCategoryIdsFromStaffSpecialties(staff).includes(formCategoryId);
            const isSelected = selectedStaffIds.includes(staff.id);

            return (
              <div
                key={staff.id}
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`${staff.name}${hasSpecialty ? ' — sugerido' : ''}`}
                tabIndex={0}
                onClick={() => onStaffToggle(staff.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onStaffToggle(staff.id);
                  }
                }}
                className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-salon-400 bg-salon-50'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => onStaffToggle(staff.id)}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{staff.name}</p>
                      {staff.role?.name && (
                        <Badge
                          variant="custom"
                          color={staff.role.color || '#6B7280'}
                          className="text-xs"
                        >
                          {staff.role.name}
                        </Badge>
                      )}
                      {hasSpecialty && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          sugerido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {getCategoryIdsFromStaffSpecialties(staff).length > 0
                        ? `Especialidades: ${getCategoryIdsFromStaffSpecialties(staff).map((cid: string) => {
                            const cat = categories.find(c => c.id === cid);
                            return cat?.icon || '';
                          }).join(' ')}`
                        : 'Sin especialidades'
                      }
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedStaffIds.length === 0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 animate-fadeIn" role="alert">
          <p className="text-sm text-amber-700">
            Sin artistas seleccionados. El servicio usar&aacute; asignaci&oacute;n por categor&iacute;a (todos los artistas con la categor&iacute;a podr&aacute;n brindarlo).
          </p>
        </div>
      )}
    </div>
  );
});
