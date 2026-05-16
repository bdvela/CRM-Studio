import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm text-center">
        <div className="size-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-zinc-400 font-semibold">404</span>
        </div>
        <h1 className="text-lg font-semibold text-zinc-900 mb-1">Página no encontrada</h1>
        <p className="text-sm text-zinc-500 mb-6">
          La página que buscas no existe o fue movida.
        </p>
        <Link href="/">
          <Button>
            <Home className="size-4 mr-2" aria-hidden="true" /> Ir al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}
