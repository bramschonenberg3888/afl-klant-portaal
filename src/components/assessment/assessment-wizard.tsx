'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QuestionCard } from './question-card';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import type { Layer } from '@/generated/prisma/client';

const layerOrder: Layer[] = ['RUIMTE_INRICHTING', 'WERKWIJZE_PROCESSEN', 'ORGANISATIE_BESTURING'];

const layerLabels: Record<Layer, string> = {
  RUIMTE_INRICHTING: 'Ruimte & Inrichting',
  WERKWIJZE_PROCESSEN: 'Werkwijze & Processen',
  ORGANISATIE_BESTURING: 'Organisatie & Besturing',
};

const layerDescriptions: Record<Layer, string> = {
  RUIMTE_INRICHTING: 'Beoordeel de fysieke inrichting en ruimtelijke indeling van uw magazijn.',
  WERKWIJZE_PROCESSEN: 'Beoordeel de werkprocessen en operationele procedures in uw magazijn.',
  ORGANISATIE_BESTURING: 'Beoordeel de organisatiestructuur en het management van uw magazijn.',
};

interface AnswerValue {
  score: number | null;
  notes?: string;
}

interface AssessmentWizardProps {
  templateId: string;
  responseId: string;
  /** Base path for result redirect, e.g. "/self-assessment" or "/assessment" */
  basePath?: string;
}

export function AssessmentWizard({
  templateId,
  responseId,
  basePath = '/self-assessment',
}: AssessmentWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const savingRef = useRef(false);

  const { data: template, isLoading } = trpc.assessment.getActiveTemplate.useQuery(undefined, {
    select: (data) => {
      if (!data || data.id !== templateId) return data;
      return data;
    },
  });

  const saveBatch = trpc.assessment.saveBatchAnswers.useMutation();
  const complete = trpc.assessment.completeAssessment.useMutation();

  const questions = template?.questions ?? [];

  // Group questions by layer
  const questionsByLayer = layerOrder.map((layer) => questions.filter((q) => q.layer === layer));

  const currentLayerQuestions = questionsByLayer[currentStep] ?? [];
  const totalSteps = layerOrder.length;

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const saveCurrentStepAnswers = async () => {
    if (savingRef.current) return;
    savingRef.current = true;

    const currentAnswers = currentLayerQuestions
      .filter((q) => answers[q.id]?.score != null)
      .map((q) => ({
        questionId: q.id,
        score: answers[q.id].score!,
        notes: answers[q.id].notes || undefined,
      }));

    if (currentAnswers.length > 0) {
      try {
        await saveBatch.mutateAsync({ responseId, answers: currentAnswers });
      } catch {
        // Silently handle save errors - answers are preserved in local state
      }
    }
    savingRef.current = false;
  };

  const handleNext = async () => {
    await saveCurrentStepAnswers();
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = async () => {
    await saveCurrentStepAnswers();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // Save final answers
      await saveCurrentStepAnswers();

      // Complete the assessment
      await complete.mutateAsync({ responseId });

      // Redirect to result page
      router.push(`${basePath}/${responseId}/result`);
    } catch {
      setIsCompleting(false);
    }
  };

  // Count answered questions per step
  const getStepProgress = (stepIndex: number) => {
    const stepQuestions = questionsByLayer[stepIndex] ?? [];
    const answered = stepQuestions.filter((q) => answers[q.id]?.score != null).length;
    return { answered, total: stepQuestions.length };
  };

  const currentProgress = getStepProgress(currentStep);
  const allAnswered = questions.every((q) => answers[q.id]?.score != null);

  // Overall progress
  const totalAnswered = questions.filter((q) => answers[q.id]?.score != null).length;
  const progressPercent =
    questions.length > 0 ? Math.round((totalAnswered / questions.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Geen vragenlijst beschikbaar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Voortgang</span>
          <span className="text-muted-foreground">
            {totalAnswered} / {questions.length} vragen ({progressPercent}%)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {layerOrder.map((layer, index) => {
          const progress = getStepProgress(index);
          const isComplete = progress.answered === progress.total && progress.total > 0;
          const isCurrent = index === currentStep;

          return (
            <button
              key={layer}
              type="button"
              onClick={async () => {
                await saveCurrentStepAnswers();
                setCurrentStep(index);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={cn(
                'flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all',
                isCurrent
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : isComplete
                    ? 'border-green-200 bg-green-50'
                    : 'border-border hover:border-primary/30'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : isComplete
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <div className="hidden min-w-0 sm:block">
                <p className={cn('truncate font-medium', isCurrent && 'text-primary')}>
                  {layerLabels[layer]}
                </p>
                <p className="text-muted-foreground">
                  {progress.answered}/{progress.total}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current step content */}
      <Card>
        <CardHeader>
          <CardTitle>{layerLabels[layerOrder[currentStep]]}</CardTitle>
          <CardDescription>{layerDescriptions[layerOrder[currentStep]]}</CardDescription>
          <CardDescription className="text-xs">
            {currentProgress.answered} van {currentProgress.total} vragen beantwoord
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {currentLayerQuestions.map((question, index) => (
          <div key={question.id}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Vraag {index + 1} van {currentLayerQuestions.length}
            </p>
            <QuestionCard
              question={question}
              value={answers[question.id] ?? { score: null }}
              onChange={(val) => handleAnswerChange(question.id, val)}
            />
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Vorige
        </Button>

        {currentStep < totalSteps - 1 ? (
          <Button onClick={handleNext}>
            Volgende
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={!allAnswered || isCompleting}>
            {isCompleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig met verwerken...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Voltooien
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
