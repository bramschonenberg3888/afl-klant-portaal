'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, Calendar, ExternalLink } from 'lucide-react';
import { trpc } from '@/trpc/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  LAYER_LABELS,
} from '@/components/actions/action-card';
import type { ActionFilters } from '@/components/actions/action-filters';

type SortField = 'title' | 'status' | 'priority' | 'dueDate' | 'layer';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const STATUS_ORDER = { TODO: 1, IN_PROGRESS: 2, DONE: 3, DEFERRED: 4, CANCELLED: 5 };

function SortableHead({
  field,
  children,
  onToggleSort,
}: {
  field: SortField;
  children: React.ReactNode;
  onToggleSort: (_field: SortField) => void;
}) {
  return (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 -ml-2 font-medium"
        onClick={() => onToggleSort(field)}
      >
        {children}
        <ArrowUpDown className="size-3" />
      </Button>
    </TableHead>
  );
}

interface ActionListProps {
  organizationId: string;
  filters: ActionFilters;
}

export function ActionList({ organizationId, filters }: ActionListProps) {
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data, isLoading } = trpc.actions.list.useQuery({
    organizationId,
    ...filters,
    limit: 100,
  });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const actions = data?.actions ?? [];

  const sortedActions = [...actions].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'title':
        return dir * a.title.localeCompare(b.title, 'nl');
      case 'status':
        return dir * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      case 'priority':
        return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      case 'dueDate': {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dir * (dateA - dateB);
      }
      case 'layer':
        return dir * (a.layer ?? '').localeCompare(b.layer ?? '', 'nl');
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (sortedActions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">Geen acties gevonden</p>
        <p className="text-sm text-muted-foreground mt-1">
          Pas de filters aan of maak een nieuwe actie aan.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead field="title" onToggleSort={toggleSort}>Titel</SortableHead>
          <SortableHead field="status" onToggleSort={toggleSort}>Status</SortableHead>
          <SortableHead field="priority" onToggleSort={toggleSort}>Prioriteit</SortableHead>
          <TableHead>Toegewezen aan</TableHead>
          <SortableHead field="dueDate" onToggleSort={toggleSort}>Deadline</SortableHead>
          <SortableHead field="layer" onToggleSort={toggleSort}>Laag</SortableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedActions.map((action) => {
          const dueDate = action.dueDate ? new Date(action.dueDate) : null;
          const isOverdue =
            dueDate &&
            dueDate < new Date() &&
            action.status !== 'DONE' &&
            action.status !== 'CANCELLED';

          return (
            <TableRow key={action.id} className="group">
              <TableCell>
                <Link
                  href={`/actions/${action.id}`}
                  className="font-medium hover:underline text-sm"
                >
                  {action.title}
                </Link>
              </TableCell>
              <TableCell>
                <Badge className={cn('text-[10px]', STATUS_COLORS[action.status])} variant="secondary">
                  {STATUS_LABELS[action.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px]">
                  {PRIORITY_LABELS[action.priority]}
                </Badge>
              </TableCell>
              <TableCell>
                {action.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[10px]">
                        {action.assignee.name
                          ? action.assignee.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{action.assignee.name ?? 'Onbekend'}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {dueDate ? (
                  <span
                    className={cn(
                      'flex items-center gap-1 text-sm',
                      isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="size-3" />
                    {dueDate.toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {action.layer ? (
                  <Badge variant="outline" className="text-[10px]">
                    {LAYER_LABELS[action.layer]}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon-xs" asChild className="opacity-0 group-hover:opacity-100">
                  <Link href={`/actions/${action.id}`}>
                    <ExternalLink className="size-3" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
