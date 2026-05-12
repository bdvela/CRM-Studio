import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary: 'bg-salon-600 text-white hover:bg-salon-700 active:bg-salon-800',
  secondary: 'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800',
  outline: 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100',
  ghost: 'text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const spinnerSizes = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
};

export function Button({ variant = 'primary', size = 'md', className, children, loading, disabled, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;
  
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2 className={cn('animate-spin mr-2', spinnerSizes[size])} />
      )}
      {children}
    </button>
  );
}
