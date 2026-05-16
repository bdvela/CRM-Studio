export default function Loading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 animate-pulse" aria-label="Cargando">
      <div className="h-8 w-36 rounded-xl bg-zinc-200" />
      <div className="h-16 rounded-2xl bg-zinc-200" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-full bg-zinc-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-zinc-200 rounded" />
                  <div className="h-4 w-1/2 bg-zinc-200 rounded" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <div className="h-5 w-20 bg-zinc-200 rounded-full" />
                <div className="h-5 w-16 bg-zinc-200 rounded-full" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <div className="h-4 w-24 bg-zinc-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
