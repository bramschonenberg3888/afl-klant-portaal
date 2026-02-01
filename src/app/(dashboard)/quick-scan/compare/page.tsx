'use client';

import { useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatrixGrid } from '@/components/quickscan/matrix-grid';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ComparePage() {
  const searchParams = useSearchParams();
  const scanIdA = searchParams.get('a');
  const scanIdB = searchParams.get('b');

  const { data } = trpc.quickscan.compareTwoScans.useQuery(
    { scanIdA: scanIdA!, scanIdB: scanIdB! },
    { enabled: !!scanIdA && !!scanIdB }
  );

  if (!scanIdA || !scanIdB) {
    return (
      <p className="text-center py-12 text-muted-foreground">
        Selecteer twee scans om te vergelijken.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/quick-scan/history">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Vergelijking</h1>
      </div>

      {data && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{data.scanA.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <MatrixGrid cells={data.scanA.cells} compact />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{data.scanB.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <MatrixGrid cells={data.scanB.cells} compact />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
