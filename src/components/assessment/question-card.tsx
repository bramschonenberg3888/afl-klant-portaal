'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const scoreLabels: Record<number, string> = {
  1: 'Zeer onvoldoende',
  2: 'Onvoldoende',
  3: 'Voldoende',
  4: 'Goed',
  5: 'Uitstekend',
};

interface QuestionData {
  id: string;
  questionText: string;
  helpText: string | null;
  sortOrder: number;
}

interface AnswerValue {
  score: number | null;
  notes?: string;
}

interface QuestionCardProps {
  question: QuestionData;
  value: AnswerValue;
  onChange: (_value: AnswerValue) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [showNotes, setShowNotes] = useState(!!value.notes);

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug">{question.questionText}</p>
          {question.helpText && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-muted-foreground"
              onClick={() => setShowHelp(!showHelp)}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">Toelichting</span>
            </Button>
          )}
        </div>

        {showHelp && question.helpText && (
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">{question.helpText}</p>
          </div>
        )}

        {/* Likert scale 1-5 */}
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => onChange({ ...value, score })}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition-all hover:border-primary/50',
                  value.score === score
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border bg-background'
                )}
              >
                <span
                  className={cn(
                    'text-lg font-bold',
                    value.score === score ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {score}
                </span>
                <span
                  className={cn(
                    'text-[10px] leading-tight',
                    value.score === score ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}
                >
                  {scoreLabels[score]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes toggle */}
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowNotes(!showNotes)}
          >
            {showNotes ? (
              <ChevronUp className="mr-1 h-3 w-3" />
            ) : (
              <ChevronDown className="mr-1 h-3 w-3" />
            )}
            Opmerking toevoegen
          </Button>
          {showNotes && (
            <Textarea
              placeholder="Optionele opmerking..."
              className="mt-2"
              rows={2}
              value={value.notes || ''}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
