'use client';

import { trpc } from '@/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatrixGrid } from '@/components/quickscan/matrix-grid';
import { ArrowLeft, ArrowRight, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';

export default function AssessmentHistoryPage() {
  const { data: assessments, isLoading } = trpc.assessment.getMyAssessments.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/self-assessment">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Evaluatie Geschiedenis</h1>
      </div>

      {/* Empty state */}
      {(!assessments || assessments.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardCheck className="h-16 w-16 text-muted-foreground/30" />
          <h2 className="mt-6 text-xl font-semibold">Geen evaluaties gevonden</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            U heeft nog geen zelfevaluaties uitgevoerd. Start uw eerste evaluatie om
            inzicht te krijgen in de veiligheid en effici&euml;ntie van uw magazijn.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/self-assessment">
              Start Zelfevaluatie
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Assessment list */}
      {assessments && assessments.length > 0 && (
        <div className="space-y-4">
          {assessments.map((assessment) => {
            const isCompleted = assessment.status === 'COMPLETED';
            const statusLabel = isCompleted ? 'Afgerond' : 'Niet afgerond';
            const statusVariant = isCompleted ? 'secondary' as const : 'outline' as const;

            return (
              <Card key={assessment.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {assessment.template?.title || 'Zelfevaluatie'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isCompleted && assessment.completedAt
                          ? `Afgerond op ${new Date(assessment.completedAt).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}`
                          : `Gestart op ${new Date(assessment.createdAt).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                      {isCompleted ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/self-assessment/${assessment.id}/result`}>
                            Bekijk resultaat
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" asChild>
                          <Link href={`/self-assessment/${assessment.id}`}>
                            Hervatten
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  {isCompleted && assessment.resultCells.length > 0 && (
                    <MatrixGrid
                      cells={assessment.resultCells.map((c) => ({
                        id: c.id,
                        layer: c.layer,
                        perspective: c.perspective,
                        score: c.score,
                        summary: null,
                      }))}
                      compact
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
