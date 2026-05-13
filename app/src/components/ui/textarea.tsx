import { cn } from '@/lib/utils';
import React, { useState, useCallback } from 'react';

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  error?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
}

export function Textarea({ label, error, className, id, onChange: externalOnChange, maxLength, value, ...props }: TextareaProps) {
  const [internalError, setInternalError] = useState<string>('');

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
      setInternalError(`Máximo ${maxLength} caracteres`);
    } else {
      setInternalError('');
    }
    
    if (externalOnChange) {
      externalOnChange(newValue);
    }
  }, [maxLength, externalOnChange]);

  const displayError = error || internalError;
  const currentValue = value ?? '';

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
            displayError && 'border-red-500 focus:ring-red-500',
            className
          )}
         rows={3}
         value={currentValue}
         onChange={handleTextareaChange}
         maxLength={maxLength}
         {...props}
       />
      {displayError && <p className="text-xs text-red-600">{displayError}</p>}
    </div>
  );
}
