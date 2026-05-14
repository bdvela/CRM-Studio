'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Clock, Users } from 'lucide-react';
import { formatServicePrice } from '@/lib/utils';
import type { ServiceCardProps } from './types';

export const ServiceCard = memo(function ServiceCard({ service, onClick }: ServiceCardProps) {
  const hasExplicitStaff = service.staff_services && service.staff_services.length > 0;

  return (
    <Card
      onClick={() => onClick(service)}
      className={`hover:shadow-md transition-shadow ${!service.active ? 'opacity-60' : ''}`}
      aria-label={`${service.name}, ${service.duration_min} minutos, ${formatServicePrice({
        price_type: service.price_type,
        price: service.price,
        price_from: service.price_from,
        price_to: service.price_to,
      })}`}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{service.name}</p>
              {hasExplicitStaff && (
                <Badge variant="default" className="text-xs" aria-label={`${service.staff_services?.length || 0} artistas asignados`}>
                  <Users className="size-3 mr-1" aria-hidden="true" />
                  {service.staff_services?.length || 0}
                </Badge>
              )}
            </div>
            {service.description && (
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{service.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="size-4" aria-hidden="true" />
            {service.duration_min} min
          </span>
          <span className={`font-semibold ${
            service.price_type === 'variable' ? 'text-amber-600' : 'text-salon-600'
          }`}>
            {formatServicePrice({
              price_type: service.price_type,
              price: service.price,
              price_from: service.price_from,
              price_to: service.price_to,
            })}
          </span>
        </div>
      </div>
    </Card>
  );
});
