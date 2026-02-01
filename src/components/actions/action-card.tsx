'use client';

import Link from 'next/link';
import { Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ActionStatus, ActionPriority, Layer, Perspective } from '@/generated/prisma/client';

const STATUS_LABELS: Record<ActionStatus, string> = {
  TODO: 'Te doen',
  IN_PROGRESS: 'In uitvoering',
  DONE: 'Afgerond',
  DEFERRED: 'Uitgesteld',
  CANCELLED: 'Geannuleerd',
};

const STATUS_COLORS: Record<ActionStatus, string> = {
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
  DEFERRED: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PRIORITY_LABELS: Record<ActionPriority, string> = {
  LOW: 'Laag',
  MEDIUM: 'Gemiddeld',
  HIGH: 'Hoog',
  URGENT: 'Urgent',
};

const PRIORITY_BORDER_COLORS: Record<ActionPriority, string> = {
  LOW: 'border-l-slate-400',
  MEDIUM: 'border-l-blue-400',
  HIGH: 'border-l-orange-500',
  URGENT: 'border-l-red-600',
};

const LAYER_LABELS: Record<Layer, string> = {
  RUIMTE_INRICHTING: 'Ruimte & Inrichting',
  WERKWIJZE_PROCESSEN: 'Werkwijze & Processen',
  ORGANISATIE_BESTURING: 'Organisatie & Besturing',
};

const PERSPECTIVE_LABELS: Record<Perspective, string> = {
  EFFICIENT: 'Effici\u00ebnt',
  VEILIG: 'Veilig',
};

export interface ActionData {
  id: string;
  title: string;
  description?: string | null;
  status: ActionStatus;
  priority: ActionPriority;
  layer?: Layer | null;
  perspective?: Perspective | null;
  dueDate?: Date | string | null;
  assignee?: { id: string; name?: string | null; image?: string | null } | null;
  reporter?: { id: string; name?: string | null } | null;
  finding?: { id: string; title: string } | null;
}

interface ActionCardProps {
  action: ActionData;
  onStatusChange?: (_actionId: string, _status: ActionStatus) => void;
  isDragging?: boolean;
}

export function ActionCard({ action, isDragging }: ActionCardProps) {
  const dueDate = action.dueDate ? new Date(action.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && action.status !== 'DONE' && action.status !== 'CANCELLED';

  return (
    <Link href={`/actions/${action.id}`}>
      <Card
        className={cn(
          'border-l-4 transition-shadow hover:shadow-md cursor-pointer',
          PRIORITY_BORDER_COLORS[action.priority],
          isDragging && 'shadow-lg ring-2 ring-primary/20 opacity-90'
        )}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium leading-tight line-clamp-2">{action.title}</h3>
            <Badge className={cn('shrink-0 text-[10px]', STATUS_COLORS[action.status])} variant="secondary">
              {STATUS_LABELS[action.status]}
            </Badge>
          </div>

          {action.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {action.layer && (
              <Badge variant="outline" className="text-[10px]">
                {LAYER_LABELS[action.layer]}
              </Badge>
            )}
            {action.perspective && (
              <Badge variant="outline" className="text-[10px]">
                {PERSPECTIVE_LABELS[action.perspective]}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {PRIORITY_LABELS[action.priority]}
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {action.assignee && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[10px]">
                        {action.assignee.name
                          ? action.assignee.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          : <User className="size-3" />}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{action.assignee.name ?? 'Niet toegewezen'}</TooltipContent>
                </Tooltip>
              )}
            </div>

            {dueDate && (
              <span
                className={cn(
                  'flex items-center gap-1 text-[10px]',
                  isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                )}
              >
                <Calendar className="size-3" />
                {dueDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_BORDER_COLORS, LAYER_LABELS, PERSPECTIVE_LABELS };
