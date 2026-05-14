export default function ClienteDetailLoading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-zinc-200" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-zinc-200 rounded-lg" />
          <div className="h-4 w-32 bg-zinc-200 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-5 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-zinc-200" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 bg-zinc-200 rounded" />
              <div className="h-5 w-20 bg-zinc-200 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-5">
        <div className="h-4 w-32 bg-zinc-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-24 bg-zinc-200 rounded" />
              <div className="h-4 w-32 bg-zinc-200 rounded hidden sm:block" />
              <div className="h-4 w-16 bg-zinc-200 rounded ml-auto" />
              <div className="h-4 w-20 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
