'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatrixGrid } from '@/components/quickscan/matrix-grid';
import { RAGBadge } from '@/components/quickscan/rag-badge';
import { RoadmapView } from '@/components/quickscan/roadmap-view';
import { ClipboardCheck, History, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function QuickScanPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId;

  const { data: scan, isLoading } = trpc.quickscan.getLatest.useQuery(
    { organizationId: orgId! },
    { enabled: !!orgId }
  );

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-lg font-medium">Geen organisatie geselecteerd</p>
        <p className="text-sm text-muted-foreground">Selecteer een organisatie om uw QuickScan te bekijken.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardCheck className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-6 text-xl font-semibold">Nog geen QuickScan beschikbaar</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Er is nog geen QuickScan uitgevoerd voor uw organisatie. Neem contact op met uw consultant om een scan in te plannen.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/chat">
            Stel een vraag aan de assistent
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{scan.title}</h1>
          <p className="text-sm text-muted-foreground">
            {scan.consultant?.name && `Uitgevoerd door ${scan.consultant.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/quick-scan/history">
              <History className="mr-2 h-4 w-4" />
              Geschiedenis
            </Link>
          </Button>
        </div>
      </div>

      {/* Overall scores */}
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

      {/* Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>3x2 Matrix</CardTitle>
          <CardDescription>Klik op een cel voor details</CardDescription>
        </CardHeader>
        <CardContent>
          <MatrixGrid cells={scan.cells} scanId={scan.id} />
        </CardContent>
      </Card>

      {/* Summary */}
      {scan.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Samenvatting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{scan.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Roadmap */}
      {scan.roadmapItems.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Routekaart</CardTitle>
              <CardDescription>30/60/90 dagen verbeterplan</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/quick-scan/${scan.id}/roadmap`}>
                Volledig overzicht
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RoadmapView items={scan.roadmapItems} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
