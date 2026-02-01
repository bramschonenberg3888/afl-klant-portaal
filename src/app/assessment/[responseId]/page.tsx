'use client';

import { use } from 'react';
import { AssessmentWizard } from '@/components/assessment/assessment-wizard';
import { trpc } from '@/trpc/client';

export default function PublicAssessmentWizardPage({
  params,
}: {
  params: Promise<{ responseId: string }>;
}) {
  const { responseId } = use(params);

  const { data: template, isLoading } = trpc.assessment.getActiveTemplate.useQuery();

  if (isLoading || !template) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <AssessmentWizard templateId={template.id} responseId={responseId} basePath="/assessment" />;
}
