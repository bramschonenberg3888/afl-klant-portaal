'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { ImpactLevel } from '@/generated/prisma/client';

const impactConfig: Record<ImpactLevel, { label: string; className: string }> = {
  NONE: { label: 'Geen', className: 'bg-gray-100 text-gray-600' },
  LOW: { label: 'Laag', className: 'bg-blue-100 text-blue-700' },
  MEDIUM: { label: 'Midden', className: 'bg-yellow-100 text-yellow-700' },
  HIGH: { label: 'Hoog', className: 'bg-red-100 text-red-700' },
};

interface FindingCardProps {
  title: string;
  description?: string | null;
  efficiencyImpact: ImpactLevel;
  safetyImpact: ImpactLevel;
  recommendation?: string | null;
  photoUrls?: string[];
}

export function FindingCard({ title, description, efficiencyImpact, safetyImpact, recommendation, photoUrls }: FindingCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {description && <p className="text-sm text-muted-foreground">{description}</p>}

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Efficiëntie:</span>
            <Badge variant="outline" className={cn('text-xs', impactConfig[efficiencyImpact].className)}>
              {impactConfig[efficiencyImpact].label}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Veiligheid:</span>
            <Badge variant="outline" className={cn('text-xs', impactConfig[safetyImpact].className)}>
              {impactConfig[safetyImpact].label}
            </Badge>
          </div>
        </div>

        {recommendation && (
          <div className="rounded-md bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-800">Aanbeveling</p>
            <p className="mt-1 text-sm text-blue-700">{recommendation}</p>
          </div>
        )}

        {photoUrls && photoUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {photoUrls.map((url, i) => (
              <Image key={i} src={url} alt={`Foto ${i + 1}`} width={80} height={80} className="h-20 w-20 rounded-md object-cover" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
