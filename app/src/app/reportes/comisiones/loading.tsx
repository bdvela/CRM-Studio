export default function Loading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-zinc-200" />
      <div className="h-20 rounded-2xl bg-zinc-200" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((n) => <div key={n} className="h-40 rounded-2xl bg-zinc-200" />)}
      </div>
    </div>
  );
}
