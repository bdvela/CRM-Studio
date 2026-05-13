import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  if (onClick) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-zinc-200 bg-white shadow-sm cursor-pointer hover:border-salon-300 hover:shadow-md transition-all',
          className
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-zinc-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

function CardHeader({ children, className }: CardProps) {
  return <div className={cn('px-5 py-4 border-b border-zinc-100', className)}>{children}</div>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}


