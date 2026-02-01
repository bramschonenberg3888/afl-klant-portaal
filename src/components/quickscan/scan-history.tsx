'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RAGBadge } from './rag-badge';
import { Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ScanStatus, RAGScore } from '@/generated/prisma/client';

const statusLabels: Record<ScanStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Concept', className: 'bg-gray-100 text-gray-600' },
  IN_REVIEW: { label: 'In review', className: 'bg-yellow-100 text-yellow-700' },
  PUBLISHED: { label: 'Gepubliceerd', className: 'bg-green-100 text-green-700' },
  ARCHIVED: { label: 'Gearchiveerd', className: 'bg-gray-100 text-gray-500' },
};

interface ScanListItem {
  id: string;
  title: string;
  scanDate: Date | string;
  status: ScanStatus;
  overallEfficiency: RAGScore | null;
  overallSafety: RAGScore | null;
  consultant: { name: string | null } | null;
  _count: { findings: number; roadmapItems: number };
}

export function ScanHistory({ scans }: { scans: ScanListItem[] }) {
  if (scans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-lg font-medium">Geen scans gevonden</p>
        <p className="text-sm text-muted-foreground">Er zijn nog geen QuickScans uitgevoerd.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scans.map((scan) => (
        <Card key={scan.id}>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">{scan.title}</p>
                <Badge variant="outline" className={statusLabels[scan.status].className}>
                  {statusLabels[scan.status].label}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{format(new Date(scan.scanDate), 'd MMMM yyyy', { locale: nl })}</span>
                {scan.consultant?.name && <span>Door: {scan.consultant.name}</span>}
                <span>{scan._count.findings} bevindingen</span>
                <span>{scan._count.roadmapItems} actiepunten</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RAGBadge score={scan.overallEfficiency} size="sm" />
              <RAGBadge score={scan.overallSafety} size="sm" />
              <Button variant="outline" size="sm" asChild>
                <Link href={`/quick-scan/${scan.id}`}>
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Bekijk
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
