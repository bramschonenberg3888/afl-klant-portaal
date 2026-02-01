'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function AdminEvaluationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const orgId = session?.user?.organizationId;

  const { data: template } = trpc.assessment.getActiveTemplate.useQuery();
  const { data: assessments, isLoading } = trpc.assessment.getOrgAssessments.useQuery(
    { organizationId: orgId! },
    { enabled: !!orgId }
  );

  const startAssessment = trpc.assessment.startAssessment.useMutation({
    onSuccess: (response) => {
      router.push(`/self-assessment/${response.id}`);
    },
  });

  function handleCreate() {
    if (!template || !orgId) return;
    startAssessment.mutate({
      organizationId: orgId,
      templateId: template.id,
    });
  }

  if (!orgId) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Geen organisatie gevonden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tussentijdse Evaluaties</h1>
          <p className="text-sm text-muted-foreground">
            Maak en beheer evaluaties voor klantorganisaties.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={!template || startAssessment.isPending}>
          {startAssessment.isPending ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1 h-4 w-4" />
          )}
          Nieuwe Evaluatie
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : !assessments || assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm text-muted-foreground">
              Nog geen evaluaties aangemaakt voor deze organisatie.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <Card key={assessment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {assessment.template?.title ?? 'Evaluatie'}
                  </CardTitle>
                  <Badge
                    variant={assessment.status === 'COMPLETED' ? 'default' : 'secondary'}
                  >
                    {assessment.status === 'COMPLETED' ? 'Afgerond' : 'Lopend'}
                  </Badge>
                </div>
                <CardDescription>
                  Gestart op{' '}
                  {new Date(assessment.createdAt).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {assessment.createdBy?.name && ` door ${assessment.createdBy.name}`}
                  {assessment.user?.name && ` - Toegewezen aan ${assessment.user.name}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  {assessment.status === 'COMPLETED' ? (
                    <a href={`/self-assessment/${assessment.id}/result`}>
                      Bekijk resultaten
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <a href={`/self-assessment/${assessment.id}`}>
                      Hervatten
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </a>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
