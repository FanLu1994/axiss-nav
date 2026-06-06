import { Skeleton } from "@/components/ui/skeleton";

export function LinkCardSkeleton() {
  return (
    <div className="axiss-panel min-h-[11rem] rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="mt-5 flex items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-12 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
  );
}
