'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RAGBadge } from './rag-badge';
import type { RAGScore, Layer, Perspective } from '@/generated/prisma/client';

interface CellData {
  id: string;
  layer: Layer;
  perspective: Perspective;
  score: RAGScore | null;
  summary: string | null;
}

const layerLabels: Record<Layer, string> = {
  RUIMTE_INRICHTING: 'Ruimte & Inrichting',
  WERKWIJZE_PROCESSEN: 'Werkwijze & Processen',
  ORGANISATIE_BESTURING: 'Organisatie & Besturing',
};

const perspectiveLabels: Record<Perspective, string> = {
  EFFICIENT: 'Efficiënt',
  VEILIG: 'Veilig',
};

const layers: Layer[] = ['RUIMTE_INRICHTING', 'WERKWIJZE_PROCESSEN', 'ORGANISATIE_BESTURING'];
const perspectives: Perspective[] = ['EFFICIENT', 'VEILIG'];

const scoreBg: Record<string, string> = {
  ROOD: 'bg-red-50 border-red-200 hover:bg-red-100',
  ORANJE: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  GROEN: 'bg-green-50 border-green-200 hover:bg-green-100',
};

interface MatrixGridProps {
  cells: CellData[];
  scanId?: string;
  compact?: boolean;
  linkPrefix?: string;
}

export function MatrixGrid({ cells, scanId, compact = false, linkPrefix }: MatrixGridProps) {
  const getCell = (layer: Layer, perspective: Perspective) =>
    cells.find((c) => c.layer === layer && c.perspective === perspective);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={cn('text-left font-medium text-muted-foreground', compact ? 'p-1.5 text-xs' : 'p-3 text-sm')} />
            {perspectives.map((p) => (
              <th key={p} className={cn('text-center font-semibold', compact ? 'p-1.5 text-xs' : 'p-3 text-sm')}>
                {perspectiveLabels[p]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {layers.map((layer) => (
            <tr key={layer}>
              <td className={cn('font-medium', compact ? 'p-1.5 text-xs' : 'p-3 text-sm')}>
                {layerLabels[layer]}
              </td>
              {perspectives.map((perspective) => {
                const cell = getCell(layer, perspective);
                const bg = cell?.score ? scoreBg[cell.score] : 'bg-gray-50 border-gray-200';
                const href = linkPrefix
                  ? `${linkPrefix}/layer/${layer.toLowerCase()}`
                  : scanId
                    ? `/quick-scan/${scanId}/layer/${layer.toLowerCase()}`
                    : undefined;

                const content = (
                  <div className={cn('flex flex-col items-center gap-1', compact ? 'p-2' : 'p-4')}>
                    <RAGBadge score={cell?.score} size={compact ? 'sm' : 'default'} />
                    {!compact && cell?.summary && (
                      <p className="mt-1 text-center text-xs text-muted-foreground line-clamp-2">
                        {cell.summary}
                      </p>
                    )}
                  </div>
                );

                return (
                  <td key={`${layer}-${perspective}`} className={cn('border rounded-lg', bg, compact ? 'p-0.5' : 'p-1')}>
                    {href ? (
                      <Link href={href} className="block rounded-md transition-colors">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { layerLabels, perspectiveLabels, layers, perspectives };
