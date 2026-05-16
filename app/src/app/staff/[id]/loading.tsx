export default function StaffDetailLoading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse" role="status" aria-label="Cargando detalle del staff">
      {/* 1. Profile card */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-6">
          <div className="flex items-start gap-5">
            <div className="size-16 rounded-full bg-zinc-200 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-zinc-200 rounded-lg" />
              <div className="h-4 w-32 bg-zinc-200 rounded-lg" />
              <div className="flex gap-2 mt-3">
                <div className="h-5 w-20 bg-zinc-200 rounded-full" />
                <div className="h-5 w-14 bg-zinc-200 rounded-full" />
              </div>
              <div className="flex gap-4 mt-4">
                <div className="h-4 w-24 bg-zinc-200 rounded" />
                <div className="h-4 w-20 bg-zinc-200 rounded" />
                <div className="h-4 w-16 bg-zinc-200 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-28 bg-zinc-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Period selector */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-14 bg-zinc-200 rounded" />
        <div className="h-9 w-48 bg-zinc-200 rounded-xl" />
      </div>

      {/* 3. Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={"skeleton-" + i} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-zinc-200" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-zinc-200 rounded" />
                <div className="h-5 w-14 bg-zinc-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Distribution card */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-4 space-y-3">
          <div className="h-4 w-48 bg-zinc-200 rounded" />
          <div className="h-3 w-full bg-zinc-200 rounded-full" />
        </div>
      </div>

      {/* 5. Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="px-5 py-4 space-y-3">
            <div className="h-4 w-36 bg-zinc-200 rounded" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={"skeleton-" + i} className="flex justify-between items-center py-2">
                  <div className="h-4 w-32 bg-zinc-200 rounded" />
                  <div className="h-4 w-16 bg-zinc-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="px-5 py-4 space-y-3">
            <div className="h-4 w-32 bg-zinc-200 rounded" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={"skeleton-" + i} className="flex justify-between items-center py-2">
                  <div className="h-4 w-20 bg-zinc-200 rounded" />
                  <div className="h-4 w-16 bg-zinc-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Appointment history */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-4 space-y-3">
          <div className="h-4 w-32 bg-zinc-200 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={"skeleton-" + i} className="flex justify-between items-center py-2">
                <div className="h-4 w-full bg-zinc-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
