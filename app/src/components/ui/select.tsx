import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  id?: string;
}

export function Select({ 
  label, 
  options, 
  value, 
  onChange, 
  error, 
  disabled, 
  placeholder = 'Seleccionar...',
  className,
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    
    function positionDropdown() {
      if (!dropdownRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = Math.min(dropdown.scrollHeight, 280);
      const above = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      
      const maxH = above
        ? Math.min(dropdownHeight, spaceAbove - 8)
        : Math.min(dropdownHeight, spaceBelow - 8);
      
      Object.assign(dropdown.style, {
        left: rect.left + 'px',
        top: above ? (rect.top - maxH - 4) + 'px' : (rect.bottom + 4) + 'px',
        width: rect.width + 'px',
        maxHeight: maxH + 'px',
        visibility: 'visible',
      });
    }
    
    const raf = requestAnimationFrame(() => {
      positionDropdown();
      window.addEventListener('resize', positionDropdown);
      window.addEventListener('scroll', positionDropdown, true);
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', positionDropdown);
      window.removeEventListener('scroll', positionDropdown, true);
    };
  }, [isOpen]);

  function handleSelect(optValue: string) {
    onChange(optValue);
    setIsOpen(false);
  }

   return (
     <div className={cn(label && 'space-y-1.5')} ref={containerRef}>
       {label && (
         <label className="block text-sm font-medium text-zinc-700">
           {label}
         </label>
       )}
       <div className="relative">
          <button
            type="button"
            id={id}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full rounded-xl border bg-white px-3 py-2.5 text-base text-left',
              'flex items-center justify-between gap-2',
              'focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent',
              'disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed',
              error ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300',
              isOpen && 'ring-2 ring-salon-500 border-transparent',
              className
            )}
         >
           <span className={cn(
             'truncate',
             !selectedOption && 'text-zinc-400'
           )}>
             {selectedOption ? selectedOption.label : placeholder}
           </span>
           <ChevronDown 
             className={cn(
               'size-4 text-zinc-400 flex-shrink-0 transition-transform',
               isOpen && 'rotate-180'
             )} 
           />
         </button>

        {isOpen && createPortal(
          <div
            ref={dropdownRef}
            className={cn(
              'max-h-70 overflow-y-auto',
              'bg-white border border-zinc-200 rounded-xl shadow-xl',
              'animate-in fade-in-0 zoom-in-95 origin-top'
            )}
            style={{ position: 'fixed', maxHeight: '280px', zIndex: 70, visibility: 'hidden' }}
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-zinc-400 text-center">
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
                       : 'text-zinc-700 hover:bg-zinc-50'
                   )}
                 >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && (
                    <Check className="size-4 text-salon-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
