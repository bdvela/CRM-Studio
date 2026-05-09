'use client';

import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto', className)}>
       {tabs.map((tab) => (
         <button
           key={tab.id}
           type="button"
           onClick={() => onChange(tab.id)}
           className={cn(
             'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex-1 justify-center',
             active === tab.id
               ? 'bg-white text-gray-900 shadow-sm'
               : 'text-gray-500 hover:text-gray-700'
           )}
         >
           {tab.icon}
           {tab.label}
         </button>
       ))}
    </div>
  );
}
