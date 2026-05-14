export default function Loading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6 animate-pulse">
      <div className="h-10 w-36 rounded-xl bg-zinc-200" />
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-1">
          <div className="h-10 w-20 rounded-xl bg-zinc-200" />
          <div className="h-10 w-16 rounded-xl bg-zinc-100" />
          <div className="h-10 w-20 rounded-xl bg-zinc-100" />
        </div>
        <div className="h-10 w-44 rounded-xl bg-zinc-200" />
        <div className="h-10 w-44 rounded-xl bg-zinc-200" />
      </div>
      <div className="space-y-2 sm:space-y-2.5">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-20 rounded-2xl bg-zinc-200" />
        ))}
      </div>
    </div>
  );
}
