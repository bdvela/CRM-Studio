import { cn } from '@/lib/utils';
import React, { useState, useCallback } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  leftPrefix?: React.ReactNode;
  onChange?: (value: string) => void;
  minLength?: number;
  maxLength?: number;
  numeric?: boolean;
}

export function Input({ 
  label, error, className, id, leftPrefix, 
  onFocus: externalOnFocus, onChange: externalOnChange,
  minLength, maxLength, numeric,
  value, ...props 
}: InputProps) {
  const [internalError, setInternalError] = useState<string>('');
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    if (numeric) {
      newValue = newValue.replace(/\D/g, '');
    }
    
    if (minLength && newValue.length > 0 && newValue.length < minLength) {
      setInternalError(`Mínimo ${minLength} caracteres`);
    } else if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
      setInternalError(`Máximo ${maxLength} caracteres`);
    } else {
      setInternalError('');
    }
    
    if (externalOnChange) {
      externalOnChange(newValue);
    }
  }, [numeric, minLength, maxLength, externalOnChange]);

  const inputOnFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (props.type === 'number') {
      e.target.select();
    }
    if (externalOnFocus) {
      externalOnFocus(e);
    }
  };

  const displayError = error || internalError;
  
  const inputMode = numeric ? 'numeric' : props.inputMode;
  const pattern = undefined;
  const maxLengthAttr = maxLength || undefined;
  
  const currentValue = value ?? '';
  const errorId = id ? `${id}-error` : undefined;

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
                value={currentValue}
                onChange={handleInputChange}
                onFocus={inputOnFocus}
                inputMode={inputMode}
                pattern={pattern}
                maxLength={maxLengthAttr}
                aria-invalid={!!displayError || undefined}
                aria-describedby={displayError && errorId ? errorId : undefined}
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
               displayError && 'border-red-500 focus:ring-red-500',
               className
             )}
             value={currentValue}
             onChange={handleInputChange}
             onFocus={inputOnFocus}
             inputMode={inputMode}
             pattern={pattern}
             maxLength={maxLengthAttr}
             aria-invalid={!!displayError || undefined}
             aria-describedby={displayError && errorId ? errorId : undefined}
             {...props}
           />
         )}
      {displayError && <p id={errorId} className="text-xs text-red-600" role="alert">{displayError}</p>}
    </div>
  );
}
