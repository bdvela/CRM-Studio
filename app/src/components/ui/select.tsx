import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({ label, options, error, className, id, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
       <select
         id={id}
         className={cn(
           'w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm',
           'focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent',
           'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
           error && 'border-red-500 focus:ring-red-500',
           className
         )}
         {...props}
       >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
