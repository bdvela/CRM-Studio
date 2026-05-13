import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'pink' | 'blue' | 'custom';
  color?: string;
  children: React.ReactNode;
  className?: string;
}

const variants = {
  default: 'bg-zinc-100/60 backdrop-blur-sm text-zinc-700 border border-zinc-200/30',
  success: 'bg-green-100/60 backdrop-blur-sm text-green-700 border border-green-200/30',
  warning: 'bg-amber-100/60 backdrop-blur-sm text-amber-700 border border-amber-200/30',
  danger: 'bg-red-100/60 backdrop-blur-sm text-red-700 border border-red-200/30',
  info: 'bg-blue-100/60 backdrop-blur-sm text-blue-700 border border-blue-200/30',
  purple: 'bg-purple-100/60 backdrop-blur-sm text-purple-700 border border-purple-200/30',
  pink: 'bg-pink-100/60 backdrop-blur-sm text-pink-700 border border-pink-200/30',
  blue: 'bg-blue-100/60 backdrop-blur-sm text-blue-700 border border-blue-200/30',
  custom: '',
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export function Badge({ variant = 'default', color, children, className }: BadgeProps) {
  const style = variant === 'custom' && color
    ? { backgroundColor: `rgba(${hexToRgb(color)}, 0.15)`, color }
    : undefined;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      style={style}
    >
      {children}
    </span>
  );
}
