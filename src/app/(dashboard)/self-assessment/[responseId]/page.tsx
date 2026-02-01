'use client';

import { use } from 'react';
import { Button } from '@/components/ui/button';
import { AssessmentWizard } from '@/components/assessment/assessment-wizard';
import { trpc } from '@/trpc/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AssessmentWizardPage({
  params,
}: {
  params: Promise<{ responseId: string }>;
}) {
  const { responseId } = use(params);
  const { data: template, isLoading } = trpc.assessment.getActiveTemplate.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Geen vragenlijst beschikbaar.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/self-assessment">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/self-assessment">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Zelfevaluatie Vragenlijst</h1>
      </div>

      <AssessmentWizard
        templateId={template.id}
        responseId={responseId}
        basePath="/self-assessment"
      />
    </div>
  );
}
