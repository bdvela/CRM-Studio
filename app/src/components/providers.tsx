'use client';

import { ReactNode } from 'react';
import { ConfirmProvider } from '@/context/confirm-context';
import { AuthProvider } from '@/context/auth-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ConfirmProvider>
        {children}
      </ConfirmProvider>
    </AuthProvider>
  );
}
