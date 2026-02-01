'use client';

import { FindingCard } from '@/components/quickscan/finding-card';
import { layerLabels, perspectiveLabels, layers, perspectives } from '@/components/quickscan/matrix-grid';
import type { QuickScanData } from './quickscan-hub';

interface TabBevindingenProps {
  scan: QuickScanData;
}

export function TabBevindingen({ scan }: TabBevindingenProps) {
  const findingsByCell = new Map<string, typeof scan.findings>();

  for (const finding of scan.findings) {
    if (!finding.cell) continue;
    const key = `${finding.cell.layer}:${finding.cell.perspective}`;
    const existing = findingsByCell.get(key) ?? [];
    existing.push(finding);
    findingsByCell.set(key, existing);
  }

  if (scan.findings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Geen bevindingen beschikbaar.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {layers.map((layer) => {
        const layerFindings = scan.findings.filter((f) => f.cell?.layer === layer);
        if (layerFindings.length === 0) return null;

        return (
          <div key={layer}>
            <h3 className="mb-4 text-lg font-semibold">{layerLabels[layer]}</h3>
            {perspectives.map((perspective) => {
              const key = `${layer}:${perspective}`;
              const cellFindings = findingsByCell.get(key) ?? [];
              if (cellFindings.length === 0) return null;

              return (
                <div key={key} className="mb-4">
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    {perspectiveLabels[perspective]} ({cellFindings.length})
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {cellFindings.map((f) => (
                      <FindingCard key={f.id} {...f} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
