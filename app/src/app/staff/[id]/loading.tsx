export default function StaffDetailLoading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-zinc-100 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-zinc-100 rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-zinc-100 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-100 animate-pulse" />)}
      </div>
      <div className="h-64 rounded-2xl bg-zinc-100 animate-pulse" />
    </div>
  );
}
