'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Finding {
  id: string;
  title: string;
  impactScore: number | null;
  effortScore: number | null;
}

interface PriorityMatrixProps {
  findings: Finding[];
}

const quadrantConfig = {
  quickWin: { label: 'Quick Wins', className: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  bigProject: {
    label: 'Grote Projecten',
    className: 'bg-blue-50 border-blue-200',
    dot: 'bg-blue-500',
  },
  filler: { label: 'Opvullers', className: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  lowPriority: {
    label: 'Lage Prioriteit',
    className: 'bg-gray-50 border-gray-200',
    dot: 'bg-gray-400',
  },
};

function getQuadrant(impactScore: number, effortScore: number) {
  const highImpact = impactScore > 2.5;
  const highEffort = effortScore > 2.5;
  if (highImpact && !highEffort) return 'quickWin';
  if (highImpact && highEffort) return 'bigProject';
  if (!highImpact && !highEffort) return 'filler';
  return 'lowPriority';
}

export function PriorityMatrix({ findings }: PriorityMatrixProps) {
  const scoredFindings = findings.filter(
    (f) => f.impactScore != null && f.effortScore != null
  ) as Array<Finding & { impactScore: number; effortScore: number }>;

  const unscoredFindings = findings.filter(
    (f) => f.impactScore == null || f.effortScore == null
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        {/* Axis labels */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-muted-foreground whitespace-nowrap">
          Impact
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-xs font-medium text-muted-foreground">
          Inspanning
        </div>

        {/* 2x2 grid */}
        <div className="ml-4 grid grid-cols-2 gap-1">
          {/* Top-left: Quick Wins (high impact, low effort) */}
          <QuadrantCell
            config={quadrantConfig.quickWin}
            findings={scoredFindings.filter((f) => getQuadrant(f.impactScore, f.effortScore) === 'quickWin')}
          />
          {/* Top-right: Grote Projecten (high impact, high effort) */}
          <QuadrantCell
            config={quadrantConfig.bigProject}
            findings={scoredFindings.filter(
              (f) => getQuadrant(f.impactScore, f.effortScore) === 'bigProject'
            )}
          />
          {/* Bottom-left: Opvullers (low impact, low effort) */}
          <QuadrantCell
            config={quadrantConfig.filler}
            findings={scoredFindings.filter((f) => getQuadrant(f.impactScore, f.effortScore) === 'filler')}
          />
          {/* Bottom-right: Lage Prioriteit (low impact, high effort) */}
          <QuadrantCell
            config={quadrantConfig.lowPriority}
            findings={scoredFindings.filter(
              (f) => getQuadrant(f.impactScore, f.effortScore) === 'lowPriority'
            )}
          />
        </div>
      </div>

      {/* Unscored findings */}
      {unscoredFindings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Niet beoordeeld ({unscoredFindings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {unscoredFindings.map((f) => (
                <li key={f.id} className="text-sm text-muted-foreground">
                  {f.title}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuadrantCell({
  config,
  findings,
}: {
  config: { label: string; className: string; dot: string };
  findings: Array<Finding & { impactScore: number; effortScore: number }>;
}) {
  return (
    <div className={cn('relative min-h-[160px] rounded-lg border p-3', config.className)}>
      <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <TooltipProvider delayDuration={200}>
          {findings.map((f) => (
            <Tooltip key={f.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'h-4 w-4 rounded-full transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-1',
                    config.dot
                  )}
                  style={{
                    position: 'relative',
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground">
                  Impact: {f.impactScore}/5 | Inspanning: {f.effortScore}/5
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
      {findings.length === 0 && (
        <p className="mt-4 text-center text-xs text-muted-foreground/60">Geen bevindingen</p>
      )}
    </div>
  );
}
