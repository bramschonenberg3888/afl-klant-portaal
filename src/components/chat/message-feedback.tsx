'use client';

import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/trpc/client';

interface MessageFeedbackProps {
  messageId: string;
  currentFeedback: string | null;
}

export function MessageFeedback({ messageId, currentFeedback }: MessageFeedbackProps) {
  const submitFeedback = trpc.chat.submitFeedback.useMutation();

  function handleFeedback(feedback: 'positive' | 'negative') {
    if (currentFeedback === feedback) return;
    submitFeedback.mutate({ messageId, feedback });
  }

  const activeFeedback = submitFeedback.data ? submitFeedback.variables?.feedback : currentFeedback;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => handleFeedback('positive')}
        disabled={submitFeedback.isPending}
        title="Goed antwoord"
      >
        <ThumbsUp
          className={cn(
            'h-3 w-3',
            activeFeedback === 'positive' && 'fill-current text-green-600'
          )}
        />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => handleFeedback('negative')}
        disabled={submitFeedback.isPending}
        title="Slecht antwoord"
      >
        <ThumbsDown
          className={cn(
            'h-3 w-3',
            activeFeedback === 'negative' && 'fill-current text-red-600'
          )}
        />
      </Button>
    </div>
  );
}
