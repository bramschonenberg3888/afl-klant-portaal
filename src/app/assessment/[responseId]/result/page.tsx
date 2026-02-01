'use client';

import { use, useState } from 'react';
import { trpc } from '@/trpc/client';
import { AssessmentResult } from '@/components/assessment/assessment-result';
import { LeadCaptureForm } from '@/components/assessment/lead-capture-form';

export default function PublicAssessmentResultPage({
  params,
}: {
  params: Promise<{ responseId: string }>;
}) {
  const { responseId } = use(params);
  const [showResult, setShowResult] = useState(false);

  const { data: result } = trpc.assessment.getResult.useQuery({ responseId });

  const hasContact = result?.contactEmail || result?.contactName;

  if (hasContact || showResult) {
    return <AssessmentResult responseId={responseId} />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Uw resultaat is klaar!</h1>
        <p className="text-muted-foreground">
          Vul uw gegevens in om uw persoonlijke resultaat te bekijken.
        </p>
      </div>
      <LeadCaptureForm responseId={responseId} onComplete={() => setShowResult(true)} />
    </div>
  );
}
