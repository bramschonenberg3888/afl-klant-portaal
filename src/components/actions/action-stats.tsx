'use client';

import { ListTodo, PlayCircle, CheckCircle2, PauseCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/trpc/client';
import { cn } from '@/lib/utils';

interface ActionStatsProps {
  organizationId: string;
}

export function ActionStats({ organizationId }: ActionStatsProps) {
  const { data: stats, isLoading } = trpc.actions.getStats.useQuery({ organizationId });

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const progressPercent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const statItems = [
    { label: 'Totaal', value: stats.total, icon: ListTodo, color: 'text-foreground', bg: 'bg-muted' },
    { label: 'Te doen', value: stats.todo, icon: ListTodo, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'In uitvoering', value: stats.inProgress, icon: PlayCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Afgerond', value: stats.done, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Uitgesteld', value: stats.deferred, icon: PauseCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Geannuleerd', value: stats.cancelled, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {statItems.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('rounded-lg p-2', item.bg)}>
                  <item.icon className={cn('size-4', item.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Voortgang</span>
          <span className="font-medium">{progressPercent}% afgerond</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
