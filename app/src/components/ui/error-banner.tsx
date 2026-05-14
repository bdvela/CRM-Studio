'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message = 'Error al cargar datos', onRetry }: ErrorBannerProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="size-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">Algo salió mal</p>
          <p className="text-xs text-red-600 mt-0.5">{message}</p>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="p-1.5 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0">
            <RefreshCw className="size-4 text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
}
