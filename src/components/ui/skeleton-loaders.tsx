import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function EmailListSkeleton() {
  return (
    <div className="divide-y divide-border/30">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full max-w-xs" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmailDetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-7 w-3/4" />
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-40" />
          <div className="space-y-2 mt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DriveGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/50 p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  );
}
