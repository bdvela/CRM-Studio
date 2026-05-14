'use client';

import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  icon: ReactNode;
  value: string;
  label: string;
  iconBgClass: string;
  iconClass: string;
  trend?: { value: number; positive: boolean } | null;
  onClick?: () => void;
}

export function DashboardStatCard({ icon, value, label, iconBgClass, iconClass, trend, onClick }: Props) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`rounded-2xl bg-white border border-zinc-100 p-5 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`size-10 rounded-xl flex items-center justify-center ${iconBgClass}`}>
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          {trend ? (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
              trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {trend.positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(trend.value)}%
            </span>
          ) : (
            <span className="text-xs text-zinc-300">—</span>
          )}
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
      <p className="text-sm text-zinc-500 mt-1">{label}</p>
    </Comp>
  );
}
