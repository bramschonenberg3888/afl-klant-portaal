'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import type { QuickScanData } from './quickscan-hub';

interface ExportPdfButtonProps {
  scan: QuickScanData;
  orgName: string;
}

export function ExportPdfButton({ scan, orgName }: ExportPdfButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    setGenerating(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { QuickScanReport } = await import('@/lib/pdf/quickscan-report');

      const blob = await pdf(<QuickScanReport scan={scan} orgName={orgName} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quickscan-${scan.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={generating}>
      {generating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-4 w-4" />
      )}
      {generating ? 'PDF genereren...' : 'PDF exporteren'}
    </Button>
  );
}
