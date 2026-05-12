export default function Loading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-40 rounded-xl bg-zinc-200" />
      <div className="h-32 rounded-2xl bg-zinc-200" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => <div key={n} className="h-28 rounded-2xl bg-zinc-200" />)}
      </div>
      <div className="h-56 rounded-2xl bg-zinc-200" />
    </div>
  );
}
