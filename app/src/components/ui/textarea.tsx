import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
       <textarea
         id={id}
         className={cn(
           'w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-base',
           'focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent',
           'resize-none',
           error && 'border-red-500 focus:ring-red-500',
           className
         )}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
