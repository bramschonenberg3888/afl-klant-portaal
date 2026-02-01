'use client';

import { RoadmapView } from '@/components/quickscan/roadmap-view';
import type { QuickScanData } from './quickscan-hub';

interface TabRoutekaartProps {
  scan: QuickScanData;
}

export function TabRoutekaart({ scan }: TabRoutekaartProps) {
  if (scan.roadmapItems.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Geen routekaart items beschikbaar.
      </p>
    );
  }

  return <RoadmapView items={scan.roadmapItems} />;
}
