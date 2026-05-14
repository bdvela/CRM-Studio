export default function Loading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 animate-pulse" role="status" aria-label="Cargando página de pagos">
      <div className="h-8 w-36 rounded-xl bg-zinc-200" />
      <div className="flex gap-1 p-1">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-10 w-28 rounded-xl bg-zinc-200" />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-24 rounded-2xl bg-zinc-200" />
        ))}
      </div>
      <div className="flex gap-3">
        <div className="h-12 flex-1 rounded-xl bg-zinc-200" />
        <div className="h-12 w-44 rounded-xl bg-zinc-200" />
        <div className="h-12 w-32 rounded-xl bg-zinc-200" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="h-16 rounded-2xl bg-zinc-200" />
        ))}
      </div>
    </div>
  );
}
