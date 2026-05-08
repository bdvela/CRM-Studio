'use client';

import { ReactNode } from 'react';
import { ConfirmProvider } from '@/context/confirm-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfirmProvider>
      {children}
    </ConfirmProvider>
  );
}
