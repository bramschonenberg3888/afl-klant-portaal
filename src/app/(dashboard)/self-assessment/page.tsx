'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatrixGrid } from '@/components/quickscan/matrix-grid';
import { ClipboardCheck, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function SelfAssessmentPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId;

  const { data: myAssessments, isLoading } = trpc.assessment.getMyAssessments.useQuery(undefined, {
    enabled: !!session?.user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  // Filter to current org assessments
  const orgAssessments = orgId
    ? myAssessments?.filter((a) => a.organizationId === orgId) ?? []
    : myAssessments ?? [];

  const inProgressAssessments = orgAssessments.filter((a) => a.status === 'IN_PROGRESS');
  const completedAssessments = orgAssessments.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tussentijdse Evaluatie</h1>
        <p className="text-sm text-muted-foreground">
          Evaluaties worden gestart door uw consultant.
        </p>
      </div>

      {/* Pending evaluations */}
      {inProgressAssessments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Openstaande evaluatie
            </CardTitle>
            <CardDescription>
              Uw consultant heeft een evaluatie klaargezet. Vul deze in om uw voortgang te meten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inProgressAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {assessment.template?.title || 'Evaluatie'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Klaargezet op {new Date(assessment.createdAt).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/self-assessment/${assessment.id}`}>
                      Invullen
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium">Geen evaluatie beschikbaar</p>
            <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
              Er staat momenteel geen evaluatie voor u klaar. Uw consultant zal een evaluatie starten
              wanneer het tijd is voor een tussentijdse beoordeling.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Completed assessments */}
      {completedAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Eerdere evaluaties
            </CardTitle>
            <CardDescription>
              Uw {completedAssessments.length} afgeronde evaluatie
              {completedAssessments.length !== 1 && 's'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedAssessments.slice(0, 3).map((assessment) => (
                <div key={assessment.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {assessment.template?.title || 'Evaluatie'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Afgerond op{' '}
                        {assessment.completedAt
                          ? new Date(assessment.completedAt).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'onbekend'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Afgerond</Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/self-assessment/${assessment.id}/result`}>
                          Bekijk
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  {assessment.resultCells.length > 0 && (
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
