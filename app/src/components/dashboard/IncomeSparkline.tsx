'use client';

import { useId } from 'react';
import type { WeekTrend } from './types';

interface Props {
  data: WeekTrend[];
  className?: string;
}

export function IncomeSparkline({ data, className = '' }: Props) {
  const id = useId();
  if (data.length < 2) return null;

  const values = data.map(d => d.amount);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const W = 120;
  const H = 32;
  const stepX = W / (values.length - 1);

  const points = values.map((v, i) => `${i * stepX},${H - ((v - min) / range) * (H - 4) - 2}`).join(' ');

  const gradientId = `sparkline-fill-${id}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full h-8 ${className}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Tendencia de ingresos últimos 7 días"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-500"
      />
      <polygon
        points={`${points} ${W},${H} 0,${H}`}
        fill={`url(#${gradientId})`}
        className="text-emerald-500"
      />
    </svg>
  );
}
