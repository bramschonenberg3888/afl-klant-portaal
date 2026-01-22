"use client";

import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface RelatedQuestionsProps {
  questions: string[];
  // eslint-disable-next-line no-unused-vars
  onSelect: (question: string) => void;
}

export function RelatedQuestions({ questions, onSelect }: RelatedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-4 border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <HelpCircle className="h-4 w-4" />
        <span>Gerelateerde vragen</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <Button key={index} variant="outline" size="sm" className="text-left h-auto py-2" onClick={() => onSelect(question)}>
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}

export const SUGGESTED_QUESTIONS = [
  "Wat zijn de belangrijkste veiligheidsvoorschriften voor een magazijn?",
  "Hoe moet ik omgaan met gevaarlijke stoffen?",
  "Welke persoonlijke beschermingsmiddelen zijn verplicht?",
  "Wat zijn de regels voor het werken op hoogte?",
];
