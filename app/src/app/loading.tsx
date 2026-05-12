export default function Loading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded-xl bg-zinc-200" />
      <div className="h-40 rounded-3xl bg-zinc-200" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-28 rounded-2xl bg-zinc-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 rounded-2xl bg-zinc-200" />
        <div className="space-y-6">
          <div className="h-56 rounded-2xl bg-zinc-200" />
          <div className="h-56 rounded-2xl bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
