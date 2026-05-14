export default function Loading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-36 rounded-xl bg-zinc-200" />
      <div className="h-14 rounded-2xl bg-zinc-200" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4 px-3 sm:px-4 rounded-2xl bg-zinc-100">
            <div className="size-10 sm:size-12 rounded-full bg-zinc-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-zinc-200 rounded" />
              <div className="h-3 w-24 bg-zinc-200 rounded" />
            </div>
            <div className="hidden sm:block space-y-1">
              <div className="h-4 w-16 bg-zinc-200 rounded" />
              <div className="h-3 w-12 bg-zinc-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
