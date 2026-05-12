export default function Loading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-36 rounded-xl bg-zinc-200" />
      <div className="h-16 rounded-2xl bg-zinc-200" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="h-36 rounded-2xl bg-zinc-200" />
        ))}
      </div>
    </div>
  );
}
