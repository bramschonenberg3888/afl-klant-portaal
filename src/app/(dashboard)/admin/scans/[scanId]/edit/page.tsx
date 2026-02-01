'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RAGBadge } from '@/components/quickscan/rag-badge';
import { layerLabels, perspectiveLabels } from '@/components/quickscan/matrix-grid';
import { ArrowLeft, Save, Send } from 'lucide-react';
import Link from 'next/link';
import type { RAGScore } from '@/generated/prisma/client';

const scores: RAGScore[] = ['ROOD', 'ORANJE', 'GROEN'];

export default function EditScanPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId;

  const utils = trpc.useUtils();
  const { data: scan, isLoading } = trpc.quickscan.getById.useQuery(
    { scanId, organizationId: orgId! },
    { enabled: !!orgId }
  );

  const updateCell = trpc.quickscan.updateCell.useMutation({
    onSuccess: () => utils.quickscan.getById.invalidate(),
  });

  const updateSummaries = trpc.quickscan.updateSummaries.useMutation({
    onSuccess: () => utils.quickscan.getById.invalidate(),
  });

  const publish = trpc.quickscan.publish.useMutation({
    onSuccess: () => router.push('/admin/scans'),
  });

  const [summary, setSummary] = useState('');

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg bg-muted" />;
  if (!scan) return <p className="text-center py-12">Scan niet gevonden</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/scans">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Terug
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{scan.title} bewerken</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (orgId) {
                updateSummaries.mutate({
                  organizationId: orgId,
                  scanId,
                  summary: summary || scan.summary || undefined,
                });
              }
            }}
            disabled={updateSummaries.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Opslaan
          </Button>
          <Button
            onClick={() => {
              if (orgId) {
                publish.mutate({ organizationId: orgId, scanId });
              }
            }}
            disabled={publish.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            Publiceren
          </Button>
        </div>
      </div>

      {/* Cell editors */}
      <div className="grid gap-4">
        {scan.cells.map((cell) => (
          <Card key={cell.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {layerLabels[cell.layer]} — {perspectiveLabels[cell.perspective]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Score</Label>
                <div className="mt-1 flex gap-2">
                  {scores.map((s) => (
                    <Button
                      key={s}
                      variant={cell.score === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (orgId) {
                          updateCell.mutate({
                            organizationId: orgId,
                            cellId: cell.id,
                            score: s,
                          });
                        }
                      }}
                    >
                      <RAGBadge score={s} size="sm" />
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Samenvatting</Label>
                <Textarea
                  defaultValue={cell.summary ?? ''}
                  onBlur={(e) => {
                    if (orgId) {
                      updateCell.mutate({
                        organizationId: orgId,
                        cellId: cell.id,
                        summary: e.target.value,
                      });
                    }
                  }}
                  placeholder="Toelichting bij deze cel..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall summary */}
      <Card>
        <CardHeader>
          <CardTitle>Algemene samenvatting</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={summary || scan.summary || ''}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Schrijf een algemene samenvatting van de scan..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
