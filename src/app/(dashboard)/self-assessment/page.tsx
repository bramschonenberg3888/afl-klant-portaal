'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MatrixGrid } from '@/components/quickscan/matrix-grid';
import { ClipboardCheck, ArrowRight, History, Loader2, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function SelfAssessmentPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const { data: template, isLoading: templateLoading } =
    trpc.assessment.getActiveTemplate.useQuery();
  const { data: myAssessments, isLoading: assessmentsLoading } =
    trpc.assessment.getMyAssessments.useQuery(undefined, { enabled: !!session?.user });

  const startAssessment = trpc.assessment.startAssessment.useMutation({
    onSuccess: (response) => {
      router.push(`/self-assessment/${response.id}`);
    },
  });

  const handleStart = () => {
    if (!template) return;
    startAssessment.mutate({
      templateId: template.id,
      userId: session?.user?.id,
      organizationId: session?.user?.organizationId ?? undefined,
    });
  };

  const isLoading = templateLoading || assessmentsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const completedAssessments = myAssessments?.filter((a) => a.status === 'COMPLETED') ?? [];
  const inProgressAssessments = myAssessments?.filter((a) => a.status === 'IN_PROGRESS') ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Zelfevaluatie</h1>
          <p className="text-sm text-muted-foreground">
            Evalueer de veiligheid en effici&euml;ntie van uw magazijn
          </p>
        </div>
        {completedAssessments.length > 0 && (
          <Button variant="outline" asChild>
            <Link href="/self-assessment/history">
              <History className="mr-2 h-4 w-4" />
              Geschiedenis
            </Link>
          </Button>
        )}
      </div>

      {/* Description & Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Magazijn Zelfevaluatie
          </CardTitle>
          <CardDescription>
            Beantwoord vragen over drie lagen van uw magazijn: Ruimte &amp; Inrichting, Werkwijze
            &amp; Processen, en Organisatie &amp; Besturing. Elke laag wordt beoordeeld vanuit twee
            perspectieven: Effici&euml;ntie en Veiligheid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-primary">
                {template?.questions?.length ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground">Vragen</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-primary">3</p>
              <p className="text-xs text-muted-foreground">Lagen</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-primary">~10 min</p>
              <p className="text-xs text-muted-foreground">Geschatte tijd</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Na het invullen ontvangt u direct een overzicht van uw scores in een 3x2 matrix met
              RAG-beoordeling (Rood/Oranje/Groen). Dit geeft u inzicht in waar uw magazijn goed
              presteert en waar verbetermogelijkheden liggen.
            </p>
          </div>

          <Button size="lg" onClick={handleStart} disabled={!template || startAssessment.isPending}>
            {startAssessment.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig...
              </>
            ) : (
              <>
                Start Zelfevaluatie
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* In-progress assessments */}
      {inProgressAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Lopende evaluaties
            </CardTitle>
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
                      {assessment.template?.title || 'Zelfevaluatie'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gestart op {new Date(assessment.createdAt).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/self-assessment/${assessment.id}`}>
                      Hervatten
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed assessments - recent */}
      {completedAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Eerdere evaluaties
            </CardTitle>
            <CardDescription>
              Uw {completedAssessments.length} meest recente afgeronde evaluatie
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
                        {assessment.template?.title || 'Zelfevaluatie'}
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
