'use client';

import { use } from 'react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatrixGrid } from '@/components/quickscan/matrix-grid';
import { RAGBadge } from '@/components/quickscan/rag-badge';
import { FindingCard } from '@/components/quickscan/finding-card';
import { RoadmapView } from '@/components/quickscan/roadmap-view';
import { ArrowLeft, Camera, Map } from 'lucide-react';
import Link from 'next/link';

export default function ScanDetailPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = use(params);
  const { data: scan, isLoading } = trpc.quickscan.getById.useQuery({ scanId });

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-lg bg-muted" />;
  }

  if (!scan) {
    return <p className="text-center text-muted-foreground py-12">Scan niet gevonden</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/quick-scan">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{scan.title}</h1>
          <p className="text-sm text-muted-foreground">
            {scan.consultant?.name && `Door ${scan.consultant.name}`}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 py-4">
            <span className="text-sm font-medium">Efficiëntie</span>
            <RAGBadge score={scan.overallEfficiency} />
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 py-4">
            <span className="text-sm font-medium">Veiligheid</span>
            <RAGBadge score={scan.overallSafety} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>3x2 Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <MatrixGrid cells={scan.cells} scanId={scan.id} />
        </CardContent>
      </Card>

      {scan.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Samenvatting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{scan.summary}</p>
          </CardContent>
        </Card>
      )}

      {scan.findings.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Bevindingen ({scan.findings.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {scan.findings.map((f) => (
              <FindingCard key={f.id} {...f} />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href={`/quick-scan/${scan.id}/roadmap`}>
            <Map className="mr-2 h-4 w-4" />
            Routekaart
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/quick-scan/${scan.id}/photos`}>
            <Camera className="mr-2 h-4 w-4" />
            Foto&apos;s
          </Link>
        </Button>
      </div>

      {scan.roadmapItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Routekaart</CardTitle>
            <CardDescription>30/60/90 dagen verbeterplan</CardDescription>
          </CardHeader>
          <CardContent>
            <RoadmapView items={scan.roadmapItems} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
