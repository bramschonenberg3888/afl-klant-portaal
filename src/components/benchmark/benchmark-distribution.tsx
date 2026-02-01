'use client';

import {
  layerLabels,
  perspectiveLabels,
  layers,
  perspectives,
} from '@/components/quickscan/matrix-grid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Layer, Perspective, RAGScore } from '@/generated/prisma/client';

interface BenchmarkCell {
  layer: Layer;
  perspective: Perspective;
  distribution: Record<RAGScore, number>;
  average: number;
  total: number;
}

interface BenchmarkDistributionProps {
  cells: BenchmarkCell[];
}

function DistributionBar({
  distribution,
  total,
}: {
  distribution: Record<RAGScore, number>;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="flex h-7 items-center justify-center rounded-md bg-gray-100 text-xs text-muted-foreground">
        Geen data
      </div>
    );
  }

  const pctRood = Math.round((distribution.ROOD / total) * 100);
  const pctOranje = Math.round((distribution.ORANJE / total) * 100);
  const pctGroen = Math.round((distribution.GROEN / total) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-7 w-full overflow-hidden rounded-md">
        {pctRood > 0 && (
          <div
            className="flex items-center justify-center bg-red-400 text-xs font-medium text-white transition-all"
            style={{ width: `${pctRood}%` }}
          >
            {pctRood >= 10 && `${pctRood}%`}
          </div>
        )}
        {pctOranje > 0 && (
          <div
            className="flex items-center justify-center bg-orange-400 text-xs font-medium text-white transition-all"
            style={{ width: `${pctOranje}%` }}
          >
            {pctOranje >= 10 && `${pctOranje}%`}
          </div>
        )}
        {pctGroen > 0 && (
          <div
            className="flex items-center justify-center bg-green-500 text-xs font-medium text-white transition-all"
            style={{ width: `${pctGroen}%` }}
          >
            {pctGroen >= 10 && `${pctGroen}%`}
          </div>
        )}
      </div>
      <div className="flex gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
          Rood {pctRood}%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />
          Oranje {pctOranje}%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          Groen {pctGroen}%
        </span>
      </div>
    </div>
  );
}

export function BenchmarkDistribution({ cells }: BenchmarkDistributionProps) {
  const getCell = (layer: Layer, perspective: Perspective) =>
    cells.find((c) => c.layer === layer && c.perspective === perspective);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distributie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {layers.map((layer) => (
            <div key={layer} className="space-y-3">
              <h3 className="text-sm font-semibold">{layerLabels[layer]}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {perspectives.map((perspective) => {
                  const cell = getCell(layer, perspective);

                  return (
                    <div
                      key={`${layer}-${perspective}`}
                      className="space-y-2 rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {perspectiveLabels[perspective]}
                        </span>
                        {cell && cell.total > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Gem. {cell.average.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {cell ? (
                        <DistributionBar distribution={cell.distribution} total={cell.total} />
                      ) : (
                        <div className="flex h-7 items-center justify-center rounded-md bg-gray-100 text-xs text-muted-foreground">
                          Geen data
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
