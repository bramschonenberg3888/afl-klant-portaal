import { Skeleton } from '@/components/ui/skeleton';

export function QuickScanSkeleton() {
  return (
    <div className="space-y-6">
      {/* Overall scores */}
      <div className="flex gap-4">
        <Skeleton className="h-16 flex-1 rounded-xl" />
        <Skeleton className="h-16 flex-1 rounded-xl" />
      </div>
      {/* Matrix grid */}
      <Skeleton className="h-64 rounded-xl" />
      {/* Summary card */}
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}
