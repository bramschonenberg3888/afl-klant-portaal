import { Skeleton } from '@/components/ui/skeleton';

export function ActionBoardSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border p-3 min-h-[400px] bg-muted/30">
          <div className="flex items-center justify-between mb-3 px-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
