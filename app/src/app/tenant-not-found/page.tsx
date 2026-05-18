import Link from 'next/link';

export const metadata = { title: 'Negocio no encontrado — CRM Studio' };

export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-salon-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="size-20 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900">Este negocio no existe</h1>
        <p className="text-sm text-zinc-500">
          El subdominio que buscás no corresponde a ningún negocio registrado o fue desactivado.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/signup"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-salon-500 to-accent-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
            Crear mi negocio
          </Link>
          <Link href="/login"
            className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors">
            Iniciar sesión
          </Link>
        </div>
        <p className="text-xs text-zinc-400 pt-2">CRM Studio</p>
      </div>
    </div>
  );
}
