'use client';

import { use } from 'react';
import { AssessmentResult } from '@/components/assessment/assessment-result';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AssessmentResultPage({ params }: { params: Promise<{ responseId: string }> }) {
  const { responseId } = use(params);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/self-assessment">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Terug naar overzicht
        </Link>
      </Button>

      <AssessmentResult
        responseId={responseId}
        basePath="/self-assessment"
        showDashboardLinks
      />
    </div>
  );
}
