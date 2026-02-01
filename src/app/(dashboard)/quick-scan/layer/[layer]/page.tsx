'use client';

import { use } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RAGBadge } from '@/components/quickscan/rag-badge';
import { FindingCard } from '@/components/quickscan/finding-card';
import { layerLabels } from '@/components/quickscan/matrix-grid';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Layer } from '@/generated/prisma/client';

const layerMap: Record<string, Layer> = {
  ruimte_inrichting: 'RUIMTE_INRICHTING',
  werkwijze_processen: 'WERKWIJZE_PROCESSEN',
  organisatie_besturing: 'ORGANISATIE_BESTURING',
};

export default function LayerDetailPage({
  params,
}: {
  params: Promise<{ layer: string }>;
}) {
  const { layer: layerParam } = use(params);
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId;

  const { data: scan } = trpc.quickscan.getLatest.useQuery(
    { organizationId: orgId! },
    { enabled: !!orgId }
  );

  const layerEnum = layerMap[layerParam];

  if (!layerEnum) {
    return <p className="text-center py-12 text-muted-foreground">Ongeldige laag</p>;
  }

  const layerCells = scan?.cells.filter((c) => c.layer === layerEnum) ?? [];
  const efficiencyCell = layerCells.find((c) => c.perspective === 'EFFICIENT');
  const safetyCell = layerCells.find((c) => c.perspective === 'VEILIG');

  const layerFindings = scan?.findings.filter((f) => f.cell?.layer === layerEnum) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/quick-scan">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{layerLabels[layerEnum]}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Efficiency */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Effici&euml;nt</CardTitle>
              <RAGBadge score={efficiencyCell?.score} />
            </div>
          </CardHeader>
          <CardContent>
            {efficiencyCell?.summary ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {efficiencyCell.summary}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Geen samenvatting beschikbaar</p>
            )}
          </CardContent>
        </Card>

        {/* Safety */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Veilig</CardTitle>
              <RAGBadge score={safetyCell?.score} />
            </div>
          </CardHeader>
          <CardContent>
            {safetyCell?.summary ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {safetyCell.summary}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Geen samenvatting beschikbaar</p>
            )}
          </CardContent>
        </Card>
      </div>

      {layerFindings.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Bevindingen ({layerFindings.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {layerFindings.map((f) => (
              <FindingCard key={f.id} {...f} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
