import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color?: 'salon' | 'accent' | 'green' | 'blue';
}

const colorMap = {
  salon: 'from-salon-500 to-salon-600',
  accent: 'from-accent-500 to-accent-600',
  green: 'from-green-500 to-green-600',
  blue: 'from-blue-500 to-blue-600',
};

export function StatCard({ label, value, icon, trend, color = 'salon' }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-2xl p-5 text-white bg-gradient-to-br',
      colorMap[color]
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="opacity-90">{icon}</span>
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            trend.positive ? 'bg-white/20' : 'bg-white/20'
          )}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-sm opacity-80 mt-1">{label}</p>
    </div>
  );
}
