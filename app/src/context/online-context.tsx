'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';

interface OnlineContextValue {
  isOnline: boolean;
}

const OnlineContext = createContext<OnlineContextValue>({ isOnline: true });

export function OnlineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') return navigator.onLine;
    return true;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión restablecida', {
        description: 'Los datos se están sincronizando',
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Sin conexión', {
        description: 'Los datos pueden estar desactualizados',
        duration: Infinity,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OnlineContext.Provider value={{ isOnline }}>
      {children}
    </OnlineContext.Provider>
  );
}

export function useOnlineStatus() {
  return useContext(OnlineContext);
}
