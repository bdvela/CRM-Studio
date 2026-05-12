import { cn } from '@/lib/utils';
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftPrefix?: React.ReactNode;
}

export function Input({ label, error, className, id, leftPrefix, onFocus: externalOnFocus, ...props }: InputProps) {
  
  const inputOnFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (props.type === 'number') {
      e.target.select();
    }
    if (externalOnFocus) {
      externalOnFocus(e);
    }
  };
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
       {leftPrefix ? (
         <div className="flex items-center rounded-xl border border-zinc-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-salon-500 focus-within:border-transparent">
           <div className="flex items-center gap-1.5 px-3 py-2.5 border-r border-zinc-200 bg-zinc-50 text-sm text-zinc-600 whitespace-nowrap">
             {leftPrefix}
           </div>
             <input
               id={id}
               className={cn(
                 'w-full px-4 py-2.5 text-base bg-transparent outline-none',
                 'disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed',
                 className
               )}
                onFocus={inputOnFocus}
               {...props}
             />
         </div>
       ) : (
          <input
            id={id}
            className={cn(
              'w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-base',
              'focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent',
              'disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            onFocus={inputOnFocus}
            {...props}
          />
        )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
