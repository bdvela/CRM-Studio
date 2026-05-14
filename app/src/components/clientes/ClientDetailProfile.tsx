'use client';

import type { ClientDetailProfileProps } from './types';
import { STATUS_LABELS, STATUS_BADGE_VARIANT } from './constants';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Instagram } from 'lucide-react';

export function ClientDetailProfile({ client }: ClientDetailProfileProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-6">
        <div className="flex items-start gap-5">
          <div
            className="size-16 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-2xl font-bold text-rose-600 flex-shrink-0"
            aria-label={`Inicial de ${client.name}`}
            role="img"
          >
            {client.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-zinc-900">{client.name}</h1>
              <Badge variant={STATUS_BADGE_VARIANT[client.status]}>{STATUS_LABELS[client.status]}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-zinc-500">
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-salon-600 transition-colors">
                  <Phone className="size-3.5" />{client.phone}
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-salon-600 transition-colors">
                  <Mail className="size-3.5" />{client.email}
                </a>
              )}
              {client.instagram && (
                <span className="flex items-center gap-1">
                  <Instagram className="size-3.5" />{client.instagram}
                </span>
              )}
            </div>
          </div>
        </div>
        {client.notes && (
          <p className="text-sm text-zinc-500 mt-4 pt-4 border-t border-zinc-100">{client.notes}</p>
        )}
      </div>
    </div>
  );
}
