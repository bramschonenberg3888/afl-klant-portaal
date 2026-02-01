'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Calendar, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { RoadmapStatus, Timeframe } from '@/generated/prisma/client';

const timeframeLabels: Record<Timeframe, string> = {
  QUICK_WIN: 'Quick Win',
  DAYS_30: '30 Dagen',
  DAYS_60: '60 Dagen',
  DAYS_90: '90 Dagen',
};

const statusConfig: Record<RoadmapStatus, { label: string; className: string }> = {
  TODO: { label: 'Te doen', className: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'Bezig', className: 'bg-blue-100 text-blue-700' },
  DONE: { label: 'Afgerond', className: 'bg-green-100 text-green-700' },
  DEFERRED: { label: 'Uitgesteld', className: 'bg-yellow-100 text-yellow-700' },
};

interface RoadmapItem {
  id: string;
  title: string;
  description?: string | null;
  timeframe: Timeframe;
  status: RoadmapStatus;
  priority: number;
  dueDate?: Date | string | null;
  owner?: { name: string | null } | null;
}

interface RoadmapViewProps {
  items: RoadmapItem[];
}

export function RoadmapView({ items }: RoadmapViewProps) {
  const grouped = Object.entries(timeframeLabels).map(([key, label]) => ({
    timeframe: key as Timeframe,
    label,
    items: items.filter((item) => item.timeframe === key),
  }));

  return (
    <div className="space-y-6">
      {grouped.map(({ timeframe, label, items: groupItems }) => (
        <div key={timeframe}>
          <h3 className="mb-3 text-lg font-semibold">{label}</h3>
          {groupItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen items</p>
          ) : (
            <div className="space-y-2">
              {groupItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.owner?.name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <UserIcon className="h-3 w-3" />
                          {item.owner.name}
                        </div>
                      )}
                      {item.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(item.dueDate), 'd MMM', { locale: nl })}
                        </div>
                      )}
                      <Badge
                        variant="outline"
                        className={cn('text-xs', statusConfig[item.status].className)}
                      >
                        {statusConfig[item.status].label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export { timeframeLabels, statusConfig };
