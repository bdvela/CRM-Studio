export default function StaffDetailLoading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse" aria-label="Cargando detalle del staff">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-zinc-200" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-zinc-200 rounded-lg" />
          <div className="h-4 w-24 bg-zinc-200 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-200" />)}
      </div>
      <div className="h-16 rounded-2xl bg-zinc-200" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-2xl bg-zinc-200" />
        <div className="h-80 rounded-2xl bg-zinc-200" />
      </div>
      <div className="h-64 rounded-2xl bg-zinc-200" />
    </div>
  );
}
