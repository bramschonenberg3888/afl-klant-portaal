'use client';

import { trpc } from '@/trpc/client';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MatrixGrid, layerLabels, perspectiveLabels, layers, perspectives } from '@/components/quickscan/matrix-grid';
import { RAGBadge } from '@/components/quickscan/rag-badge';
import { MessageSquare, Download, ArrowLeft, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { RAGScore } from '@/generated/prisma/client';

const ragTextMap: Record<RAGScore, string> = {
  ROOD: 'Aandachtspunt - directe actie vereist',
  ORANJE: 'Verbeterpunt - plan actie in',
  GROEN: 'Op orde - onderhoud huidige niveau',
};

interface AssessmentResultProps {
  responseId: string;
  /** Base path for back navigation, e.g. "/self-assessment" or "/assessment" */
  basePath?: string;
  /** Whether to show dashboard navigation CTAs */
  showDashboardLinks?: boolean;
}

export function AssessmentResult({ responseId, basePath = '/self-assessment', showDashboardLinks = true }: AssessmentResultProps) {
  const { data: result, isLoading } = trpc.assessment.getResult.useQuery({ responseId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!result || !result.resultCells || result.resultCells.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Geen resultaten gevonden voor deze evaluatie.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={basePath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar overzicht
          </Link>
        </Button>
      </div>
    );
  }

  // Map resultCells to the format MatrixGrid expects
  const matrixCells = result.resultCells.map((cell) => ({
    id: cell.id,
    layer: cell.layer,
    perspective: cell.perspective,
    score: cell.score,
    summary: null,
  }));

  // Count scores by RAG level
  const ragCounts: Record<RAGScore, number> = { ROOD: 0, ORANJE: 0, GROEN: 0 };
  result.resultCells.forEach((cell) => {
    if (cell.score) {
      ragCounts[cell.score]++;
    }
  });

  // Determine overall assessment
  const overallMessage = ragCounts.ROOD > 0
    ? 'Uw magazijn heeft aandachtspunten die directe actie vereisen. Wij adviseren u om contact op te nemen voor een uitgebreide QuickScan.'
    : ragCounts.ORANJE > 0
      ? 'Uw magazijn scoort redelijk, maar er zijn verbeterpunten. Een QuickScan kan helpen om gerichte verbeteracties te identificeren.'
      : 'Uw magazijn scoort goed op alle vlakken. Blijf het huidige niveau onderhouden en overweeg een periodieke evaluatie.';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Resultaat Zelfevaluatie</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {result.template?.title || 'Magazijn Zelfevaluatie'}
          {result.completedAt && (
            <> &mdash; {new Date(result.completedAt).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}</>
          )}
        </p>
      </div>

      {/* 3x2 Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>3x2 Matrix Overzicht</CardTitle>
          <CardDescription>
            Uw scores verdeeld over drie lagen en twee perspectieven
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatrixGrid cells={matrixCells} compact={false} />
        </CardContent>
      </Card>

      {/* Per-cell details */}
      <Card>
        <CardHeader>
          <CardTitle>Gedetailleerde Scores</CardTitle>
          <CardDescription>Score per cel met RAG-beoordeling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {layers.map((layer) => (
              <div key={layer}>
                <p className="mb-2 text-sm font-semibold">{layerLabels[layer]}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {perspectives.map((perspective) => {
                    const cell = result.resultCells.find(
                      (c) => c.layer === layer && c.perspective === perspective
                    );
                    if (!cell) return null;

                    return (
                      <div
                        key={`${layer}-${perspective}`}
                        className={cn(
                          'flex items-center justify-between rounded-lg border px-4 py-3',
                          cell.score === 'ROOD' && 'border-red-200 bg-red-50',
                          cell.score === 'ORANJE' && 'border-orange-200 bg-orange-50',
                          cell.score === 'GROEN' && 'border-green-200 bg-green-50',
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium">{perspectiveLabels[perspective]}</p>
                          <p className="text-xs text-muted-foreground">
                            Score: {cell.rawScore.toFixed(1)} / 5.0
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <RAGBadge score={cell.score} />
                          {cell.score && (
                            <span className="text-[10px] text-muted-foreground">
                              {ragTextMap[cell.score]}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {layer !== 'ORGANISATIE_BESTURING' && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overall summary */}
      <Card>
        <CardHeader>
          <CardTitle>Samenvatting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex gap-2">
              {ragCounts.GROEN > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  {ragCounts.GROEN}x Groen
                </span>
              )}
              {ragCounts.ORANJE > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                  {ragCounts.ORANJE}x Oranje
                </span>
              )}
              {ragCounts.ROOD > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  {ragCounts.ROOD}x Rood
                </span>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{overallMessage}</p>
        </CardContent>
      </Card>

      {/* CTA buttons */}
      <div className="flex flex-wrap gap-3">
        {showDashboardLinks && (
          <>
            <Button asChild>
              <Link href="/chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Bespreek met de assistent
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/quick-scan">
                <BarChart3 className="mr-2 h-4 w-4" />
                Bekijk QuickScan
              </Link>
            </Button>
          </>
        )}
        {!showDashboardLinks && (
          <Button asChild>
            <Link href="https://logistiekconcurrent.nl/contact" target="_blank" rel="noopener noreferrer">
              <MessageSquare className="mr-2 h-4 w-4" />
              Neem contact op voor een QuickScan
            </Link>
          </Button>
        )}
        <Button variant="outline" onClick={() => window.print()}>
          <Download className="mr-2 h-4 w-4" />
          Resultaat opslaan
        </Button>
      </div>
    </div>
  );
}
