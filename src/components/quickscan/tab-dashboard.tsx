'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MatrixGrid } from '@/components/quickscan/matrix-grid';
import { RAGBadge } from '@/components/quickscan/rag-badge';
import type { QuickScanData } from './quickscan-hub';

interface TabDashboardProps {
  scan: QuickScanData;
}

export function TabDashboard({ scan }: TabDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Overall scores */}
      <div className="flex gap-4">
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 py-4">
            <span className="text-sm font-medium">Effici&euml;ntie</span>
            <RAGBadge score={scan.overallEfficiency} />
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 py-4">
            <span className="text-sm font-medium">Veiligheid</span>
            <RAGBadge score={scan.overallSafety} />
          </CardContent>
        </Card>
      </div>

      {/* Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>3x2 Matrix</CardTitle>
          <CardDescription>Klik op een cel voor details</CardDescription>
        </CardHeader>
        <CardContent>
          <MatrixGrid cells={scan.cells} linkPrefix="/quick-scan" />
        </CardContent>
      </Card>

      {/* Summary */}
      {scan.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Samenvatting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{scan.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Consultant info */}
      {scan.consultant?.name && (
        <p className="text-sm text-muted-foreground">
          Uitgevoerd door {scan.consultant.name}
        </p>
      )}
    </div>
  );
}
