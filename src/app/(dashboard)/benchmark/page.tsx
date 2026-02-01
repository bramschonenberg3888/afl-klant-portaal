'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import { BenchmarkComparison } from '@/components/benchmark/benchmark-comparison';
import { BenchmarkDistribution } from '@/components/benchmark/benchmark-distribution';
import { BenchmarkNotAvailable } from '@/components/benchmark/benchmark-not-available';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, RefreshCw, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { BenchmarkSkeleton } from '@/components/skeletons/benchmark-skeleton';

export default function BenchmarkPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId;
  const isAdmin = session?.user?.globalRole === 'ADMIN';

  const { data: latestBenchmark, isLoading: benchmarkLoading } =
    trpc.benchmark.getLatestBenchmark.useQuery();

  const { data: myPosition, isLoading: positionLoading } = trpc.benchmark.getMyPosition.useQuery(
    { organizationId: orgId! },
    { enabled: !!orgId }
  );

  const utils = trpc.useUtils();
  const generateMutation = trpc.benchmark.generateBenchmark.useMutation({
    onSuccess: () => {
      utils.benchmark.getLatestBenchmark.invalidate();
      if (orgId) {
        utils.benchmark.getMyPosition.invalidate();
      }
    },
  });

  const isLoading = benchmarkLoading || positionLoading;

  if (isLoading) {
    return <BenchmarkSkeleton />;
  }

  const hasBenchmark = !!latestBenchmark;
  const hasScan = !!myPosition?.scan;
  const benchmarkTotalScans = latestBenchmark?.totalScans ?? myPosition?.totalScans;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Benchmark</h1>
          <p className="text-sm text-muted-foreground">
            Vergelijk uw organisatie met andere deelnemers.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`}
            />
            Benchmark Genereren
          </Button>
        )}
      </div>

      {/* No benchmark available */}
      {!hasBenchmark && <BenchmarkNotAvailable totalScans={benchmarkTotalScans} />}

      {/* Benchmark exists but user has no scan */}
      {hasBenchmark && !hasScan && (
        <>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">Geen scan beschikbaar</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Voltooi eerst een QuickScan om uw positie ten opzichte van de benchmark te zien.
              </p>
              <Button className="mt-4" variant="outline" asChild>
                <Link href="/quick-scan">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Naar QuickScan
                </Link>
              </Button>
            </CardContent>
          </Card>

          <BenchmarkDistribution cells={latestBenchmark.data.cells} />
        </>
      )}

      {/* Both benchmark and scan exist */}
      {hasBenchmark && hasScan && myPosition && (
        <>
          <BenchmarkComparison
            scan={myPosition.scan}
            benchmark={myPosition.benchmark}
            totalScans={myPosition.totalScans}
          />

          <BenchmarkDistribution cells={latestBenchmark.data.cells} />
        </>
      )}
    </div>
  );
}
