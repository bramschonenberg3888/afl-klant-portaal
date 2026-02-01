'use client';

import { use } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { RoadmapView } from '@/components/quickscan/roadmap-view';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RoadmapPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = use(params);
  const { data: scan } = trpc.quickscan.getById.useQuery({ scanId });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/quick-scan/${scanId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug naar scan
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Routekaart</h1>
      </div>

      {scan?.roadmapItems && <RoadmapView items={scan.roadmapItems} />}
    </div>
  );
}
