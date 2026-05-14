import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <Skeleton className="h-40 md:h-48 rounded-3xl w-full" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={`stat-${n}`} className="rounded-2xl bg-white/60 backdrop-blur-lg border border-white/40 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={`appt-${n}`} className="flex items-center gap-4 p-3 rounded-xl">
                <div className="text-center w-14 flex-shrink-0">
                  <Skeleton className="h-5 w-16 mx-auto mb-1" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                </div>
                <Skeleton className="w-px h-10 bg-zinc-100" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32 ml-9" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-50">
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((n) => (
                <div key={`action-${n}`} className="flex items-center gap-3 p-3 rounded-xl">
                  <Skeleton className="size-9 rounded-lg" />
                  <Skeleton className="h-5 w-28 flex-1" />
                  <Skeleton className="size-4" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-50">
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="p-4 space-y-2">
              {[1, 2].map((n) => (
                <div key={`payment-${n}`} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-5 w-36 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20 ml-3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
