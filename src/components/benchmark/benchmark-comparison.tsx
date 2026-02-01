'use client';

import { cn } from '@/lib/utils';
import { RAGBadge } from '@/components/quickscan/rag-badge';
import {
  layerLabels,
  perspectiveLabels,
  layers,
  perspectives,
} from '@/components/quickscan/matrix-grid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Layer, Perspective, RAGScore } from '@/generated/prisma/client';

interface ScanCell {
  layer: Layer;
  perspective: Perspective;
  score: RAGScore | null;
}

interface BenchmarkCell {
  layer: Layer;
  perspective: Perspective;
  distribution: Record<RAGScore, number>;
  average: number;
  total: number;
}

interface BenchmarkComparisonProps {
  scan: { cells: ScanCell[] };
  benchmark: { cells: BenchmarkCell[] };
  totalScans: number;
}

const SCORE_VALUES: Record<RAGScore, number> = {
  ROOD: 1,
  ORANJE: 2,
  GROEN: 3,
};

export function BenchmarkComparison({ scan, benchmark, totalScans }: BenchmarkComparisonProps) {
  const getScanCell = (layer: Layer, perspective: Perspective) =>
    scan.cells.find((c) => c.layer === layer && c.perspective === perspective);

  const getBenchmarkCell = (layer: Layer, perspective: Perspective) =>
    benchmark.cells.find((c) => c.layer === layer && c.perspective === perspective);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Uw Positie</span>
          <span className="text-sm font-normal text-muted-foreground">
            Gebaseerd op {totalScans} scans
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left text-sm font-medium text-muted-foreground" />
                {perspectives.map((p) => (
                  <th key={p} className="p-3 text-center text-sm font-semibold">
                    {perspectiveLabels[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {layers.map((layer) => (
                <tr key={layer}>
                  <td className="p-3 text-sm font-medium">{layerLabels[layer]}</td>
                  {perspectives.map((perspective) => {
                    const scanCell = getScanCell(layer, perspective);
                    const benchmarkCell = getBenchmarkCell(layer, perspective);
                    const userScore = scanCell?.score ? SCORE_VALUES[scanCell.score] : null;
                    const avg = benchmarkCell?.average ?? 0;

                    let comparison: 'above' | 'below' | 'equal' = 'equal';
                    if (userScore !== null && avg > 0) {
                      if (userScore > avg) comparison = 'above';
                      else if (userScore < avg) comparison = 'below';
                    }

                    return (
                      <td key={`${layer}-${perspective}`} className="p-1">
                        <div
                          className={cn(
                            'rounded-lg border p-4 flex flex-col items-center gap-3',
                            comparison === 'above' && 'bg-green-50 border-green-200',
                            comparison === 'below' && 'bg-red-50 border-red-200',
                            comparison === 'equal' && 'bg-gray-50 border-gray-200'
                          )}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-muted-foreground">Uw score</span>
                            <RAGBadge score={scanCell?.score ?? null} />
                          </div>

                          <div className="h-px w-full bg-border" />

                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-muted-foreground">Gemiddelde</span>
                            <span className="text-lg font-semibold">
                              {avg > 0 ? avg.toFixed(1) : '-'}
                            </span>
                          </div>

                          <div className="h-px w-full bg-border" />

                          <div className="flex items-center gap-1.5">
                            {comparison === 'above' && (
                              <>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-xs font-medium text-green-700">
                                  Boven gemiddeld
                                </span>
                              </>
                            )}
                            {comparison === 'below' && (
                              <>
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                <span className="text-xs font-medium text-red-700">
                                  Onder gemiddeld
                                </span>
                              </>
                            )}
                            {comparison === 'equal' && (
                              <>
                                <Minus className="h-4 w-4 text-gray-500" />
                                <span className="text-xs font-medium text-gray-600">Gemiddeld</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
