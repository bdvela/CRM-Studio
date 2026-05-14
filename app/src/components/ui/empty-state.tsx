import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('py-16 text-center', className)}>
      <div className="size-16 rounded-2xl bg-zinc-50 flex items-center justify-center mx-auto mb-4">
        <Icon className="size-8 text-zinc-300" />
      </div>
      <p className="text-base font-semibold text-zinc-900">{title}</p>
      {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
