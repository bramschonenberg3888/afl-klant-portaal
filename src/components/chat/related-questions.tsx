'use client';

import { ArrowRight } from 'lucide-react';

interface RelatedQuestionsProps {
  questions: string[];
  // eslint-disable-next-line no-unused-vars
  onSelect: (question: string) => void;
}

export function RelatedQuestions({ questions, onSelect }: RelatedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
      {questions.map((question, index) => (
        <button
          key={index}
          type="button"
          className="flex items-start gap-3 rounded-lg border p-4 text-left text-sm transition-colors hover:bg-muted cursor-pointer"
          onClick={() => onSelect(question)}
        >
          <span className="flex-1">{question}</span>
          <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

export const SUGGESTED_QUESTIONS = [
  'Wat zijn de belangrijkste veiligheidsvoorschriften voor een magazijn?',
  'Hoe moet ik omgaan met gevaarlijke stoffen?',
  'Welke persoonlijke beschermingsmiddelen zijn verplicht?',
  'Wat zijn de regels voor het werken op hoogte?',
];
