'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MatrixGrid } from '@/components/quickscan/matrix-grid';
import { RAGBadge } from '@/components/quickscan/rag-badge';
import { Plus, Edit, Eye } from 'lucide-react';
import Link from 'next/link';

export default function AdminScansPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId;

  const { data: scan, isLoading } = trpc.quickscan.getLatest.useQuery(
    { organizationId: orgId! },
    { enabled: !!orgId }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scans Beheren</h1>
        <Button asChild>
          <Link href="/admin/scans/new">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe scan
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      ) : scan ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{scan.title}</CardTitle>
                <CardDescription>
                  {scan.consultant?.name && `Consultant: ${scan.consultant.name}`}
                  {' | '}
                  {new Date(scan.scanDate).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{scan.status}</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/scans/${scan.id}/edit`}>
                    <Edit className="mr-1 h-3.5 w-3.5" />
                    Bewerken
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/quick-scan">
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Bekijken
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Effici&euml;ntie:</span>
                <RAGBadge score={scan.overallEfficiency} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Veiligheid:</span>
                <RAGBadge score={scan.overallSafety} />
              </div>
            </div>
            <MatrixGrid cells={scan.cells} compact />
            <p className="text-sm text-muted-foreground">
              {scan.findings.length} bevindingen | {scan.roadmapItems.length} routekaart items
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Nog geen scan aangemaakt voor deze organisatie.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/admin/scans/new">
                <Plus className="mr-2 h-4 w-4" />
                Eerste scan aanmaken
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
