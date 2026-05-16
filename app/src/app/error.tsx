'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm text-center">
        <div className="size-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-7 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-zinc-900 mb-1">Algo salió mal</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Ocurrió un error inesperado. Intenta de nuevo.
        </p>
        <Button onClick={reset}>
          Reintentar
        </Button>
      </div>
    </div>
  );
}
