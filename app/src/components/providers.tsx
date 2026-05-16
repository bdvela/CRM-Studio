'use client';

import type { ReactNode } from 'react';
import { ConfirmProvider } from '@/context/confirm-context';
import { AuthProvider } from '@/context/auth-context';
import { OnlineProvider } from '@/context/online-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <OnlineProvider>
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
      </OnlineProvider>
    </AuthProvider>
  );
}
