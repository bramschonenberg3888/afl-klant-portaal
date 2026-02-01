'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { trpc } from '@/trpc/client';
import { ActionCard, STATUS_LABELS } from '@/components/actions/action-card';
import { ActionBoardSkeleton } from '@/components/skeletons/action-board-skeleton';
import { cn } from '@/lib/utils';
import type { ActionStatus } from '@/generated/prisma/client';
import type { ActionFilters } from '@/components/actions/action-filters';
import type { ActionData } from '@/components/actions/action-card';

const BOARD_COLUMNS: ActionStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'DEFERRED'];

const COLUMN_COLORS: Record<ActionStatus, string> = {
  TODO: 'bg-slate-50 border-slate-200',
  IN_PROGRESS: 'bg-blue-50 border-blue-200',
  DONE: 'bg-green-50 border-green-200',
  DEFERRED: 'bg-amber-50 border-amber-200',
  CANCELLED: 'bg-red-50 border-red-200',
};

const COLUMN_HEADER_COLORS: Record<ActionStatus, string> = {
  TODO: 'text-slate-700',
  IN_PROGRESS: 'text-blue-700',
  DONE: 'text-green-700',
  DEFERRED: 'text-amber-700',
  CANCELLED: 'text-red-700',
};

interface ActionBoardProps {
  organizationId: string;
  filters: ActionFilters;
}

function SortableActionCard({ action }: { action: ActionData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: action.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ActionCard action={action} isDragging={isDragging} />
    </div>
  );
}

function DroppableColumn({ status, actions }: { status: ActionStatus; actions: ActionData[] }) {
  const actionIds = actions.map((a) => a.id);

  return (
    <div className={cn('rounded-xl border p-3 min-h-[400px] flex flex-col', COLUMN_COLORS[status])}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className={cn('text-sm font-semibold', COLUMN_HEADER_COLORS[status])}>
          {STATUS_LABELS[status]}
        </h3>
        <span className="text-xs font-medium text-muted-foreground bg-background rounded-full px-2 py-0.5">
          {actions.length}
        </span>
      </div>
      <SortableContext items={actionIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2">
          {actions.map((action) => (
            <SortableActionCard key={action.id} action={action} />
          ))}
          {actions.length === 0 && (
            <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-muted-foreground/20">
              <p className="text-xs text-muted-foreground">Geen acties</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function ActionBoard({ organizationId, filters }: ActionBoardProps) {
  const [activeAction, setActiveAction] = useState<ActionData | null>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.actions.list.useQuery({
    organizationId,
    ...filters,
    limit: 100,
  });

  const queryKey = { organizationId, ...filters, limit: 100 };

  const updateStatus = trpc.actions.updateStatus.useMutation({
    onMutate: async ({ actionId, status }) => {
      await utils.actions.list.cancel();
      const previousData = utils.actions.list.getData(queryKey);

      utils.actions.list.setData(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          actions: old.actions.map((a) => (a.id === actionId ? { ...a, status } : a)),
        };
      });

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        utils.actions.list.setData(queryKey, context.previousData);
      }
      toast.error('Status update mislukt');
    },
    onSettled: () => {
      utils.actions.list.invalidate();
      utils.actions.getStats.invalidate();
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const actions = useMemo(() => data?.actions ?? [], [data?.actions]);

  const actionsByStatus = useCallback(
    (status: ActionStatus) => actions.filter((a) => a.status === status),
    [actions]
  );

  function findColumnForAction(actionId: string): ActionStatus | undefined {
    const action = actions.find((a) => a.id === actionId);
    return action?.status;
  }

  function handleDragStart(event: DragStartEvent) {
    const dragged = actions.find((a) => a.id === event.active.id);
    setActiveAction(dragged ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveAction(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceStatus = findColumnForAction(activeId);
    let targetStatus: ActionStatus | undefined;

    if (BOARD_COLUMNS.includes(overId as ActionStatus)) {
      targetStatus = overId as ActionStatus;
    } else {
      targetStatus = findColumnForAction(overId);
    }

    if (!sourceStatus || !targetStatus || sourceStatus === targetStatus) return;

    updateStatus.mutate({
      organizationId,
      actionId: activeId,
      status: targetStatus,
    });
  }

  if (isLoading) {
    return <ActionBoardSkeleton />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {BOARD_COLUMNS.map((status) => (
          <DroppableColumn key={status} status={status} actions={actionsByStatus(status)} />
        ))}
      </div>

      <DragOverlay>{activeAction && <ActionCard action={activeAction} isDragging />}</DragOverlay>
    </DndContext>
  );
}
