import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'pink' | 'blue' | 'custom';
  color?: string;
  children: React.ReactNode;
  className?: string;
}

const variants = {
  default: 'bg-zinc-100 text-zinc-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  pink: 'bg-pink-100 text-pink-700',
  blue: 'bg-blue-100 text-blue-700',
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
