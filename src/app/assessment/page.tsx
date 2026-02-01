'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PublicAssessmentPage() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const { data: template, isLoading } = trpc.assessment.getActiveTemplate.useQuery();
  const startMutation = trpc.assessment.startPublicAssessment.useMutation({
    onSuccess: (response) => {
      router.push(`/assessment/${response.id}`);
    },
    onSettled: () => setStarting(false),
  });

  const handleStart = () => {
    if (!template) return;
    setStarting(true);
    startMutation.mutate({ templateId: template.id });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <ClipboardCheck className="mx-auto h-16 w-16 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Zelfevaluatie Magazijnveiligheid</h1>
        <p className="mx-auto max-w-lg text-muted-foreground">
          Ontdek hoe uw magazijn scoort op het gebied van effici&euml;ntie en veiligheid. Deze
          zelfevaluatie geeft u direct inzicht in verbetermogelijkheden.
        </p>
      </div>

      {template ? (
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>{template.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.description && (
              <p className="text-sm text-muted-foreground">{template.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {template.questions.length} vragen &bull; Circa 10 minuten
            </p>
            <Button onClick={handleStart} disabled={starting} className="w-full" size="lg">
              {starting ? 'Even geduld...' : 'Start Zelfevaluatie'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center text-muted-foreground">
          Er is momenteel geen zelfevaluatie beschikbaar.
        </div>
      )}
    </div>
  );
}
