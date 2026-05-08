import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function Select({ 
  label, 
  options, 
  value, 
  onChange, 
  error, 
  disabled, 
  placeholder = 'Seleccionar...',
  className 
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current && containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      
      const spaceBelow = window.innerHeight - container.bottom;
      const spaceAbove = container.top;
      const dropdownHeight = Math.min(dropdown.scrollHeight, 280);
      
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        dropdown.style.bottom = '100%';
        dropdown.style.top = 'auto';
        dropdown.style.marginBottom = '4px';
        dropdown.style.marginTop = '0';
      } else {
        dropdown.style.top = '100%';
        dropdown.style.bottom = 'auto';
        dropdown.style.marginTop = '4px';
        dropdown.style.marginBottom = '0';
      }
    }
  }, [isOpen]);

  function handleSelect(optValue: string) {
    onChange(optValue);
    setIsOpen(false);
  }

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
           className={cn(
             'w-full rounded-xl border bg-white px-4 py-2.5 pr-10 text-base text-left',
             'flex items-center justify-between',
             'focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent',
             'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
             error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
             isOpen && 'ring-2 ring-salon-500 border-transparent',
             className
           )}
        >
          <span className={cn(
            'truncate',
            !selectedOption && 'text-gray-400'
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown 
            className={cn(
              'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform',
              isOpen && 'rotate-180'
            )} 
          />
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              'absolute left-0 right-0 z-50',
              'max-h-70 overflow-y-auto',
              'bg-white border border-gray-200 rounded-xl shadow-xl',
              'animate-in fade-in-0 zoom-in-95'
            )}
            style={{ maxHeight: '280px' }}
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                No hay opciones
              </div>
            ) : (
              options.map((opt) => (
                 <button
                   key={opt.value}
                   type="button"
                   onClick={() => handleSelect(opt.value)}
                   className={cn(
                     'w-full px-4 py-2.5 text-base text-left flex items-center justify-between',
                     'transition-colors',
                     opt.value === value 
                       ? 'bg-salon-50 text-salon-700' 
                       : 'text-gray-700 hover:bg-gray-50'
                   )}
                 >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && (
                    <Check className="w-4 h-4 text-salon-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
