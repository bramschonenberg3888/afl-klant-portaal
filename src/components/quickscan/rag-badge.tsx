'use client';

import { cn } from '@/lib/utils';
import type { RAGScore } from '@/generated/prisma/client';

const scoreConfig: Record<RAGScore, { label: string; className: string }> = {
  ROOD: { label: 'Rood', className: 'bg-red-100 text-red-800 border-red-200' },
  ORANJE: { label: 'Oranje', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  GROEN: { label: 'Groen', className: 'bg-green-100 text-green-800 border-green-200' },
};

export function RAGBadge({ score, size = 'default' }: { score: RAGScore | null | undefined; size?: 'sm' | 'default' }) {
  if (!score) {
    return (
      <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 border-gray-200', size === 'sm' && 'px-2 py-0 text-[10px]')}>
        N/A
      </span>
    );
  }

  const config = scoreConfig[score];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', config.className, size === 'sm' && 'px-2 py-0 text-[10px]')}>
      {config.label}
    </span>
  );
}
