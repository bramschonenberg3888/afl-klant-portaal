'use client';

import { PriorityMatrix } from '@/components/quickscan/priority-matrix';
import type { QuickScanData } from './quickscan-hub';

interface TabPrioriteitenProps {
  scan: QuickScanData;
}

export function TabPrioriteiten({ scan }: TabPrioriteitenProps) {
  const findings = scan.findings.map((f) => ({
    id: f.id,
    title: f.title,
    impactScore: f.impactScore,
    effortScore: f.effortScore,
  }));

  if (findings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Geen bevindingen beschikbaar om te prioriteren.
      </p>
    );
  }

  return <PriorityMatrix findings={findings} />;
}
