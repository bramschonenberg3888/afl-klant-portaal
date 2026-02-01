'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActionStats } from '@/components/actions/action-stats';
import { ActionFiltersToolbar, type ActionFilters } from '@/components/actions/action-filters';
import { ActionBoard } from '@/components/actions/action-board';
import { ActionList } from '@/components/actions/action-list';

type ViewMode = 'board' | 'list';

export default function ActionsPage() {
  const { data: session } = useSession();
  const organizationId = session?.user?.organizationId;
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [filters, setFilters] = useState<ActionFilters>({});

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Geen organisatie gevonden. Log opnieuw in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Acties</h1>
          <p className="text-muted-foreground">Beheer en volg verbeteracties voor uw organisatie.</p>
        </div>
        <Button asChild>
          <Link href="/actions/new">
            <Plus className="mr-1 h-4 w-4" />
            Nieuwe Actie
          </Link>
        </Button>
      </div>

      <ActionStats organizationId={organizationId} />

      <div className="flex items-center justify-between gap-4">
        <ActionFiltersToolbar filters={filters} onChange={setFilters} />
        <div className="flex items-center gap-1 rounded-lg border p-1 shrink-0">
          <Button
            variant={viewMode === 'board' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('board')}
            aria-label="Bordweergave"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('list')}
            aria-label="Lijstweergave"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <ActionBoard organizationId={organizationId} filters={filters} />
      ) : (
        <ActionList organizationId={organizationId} filters={filters} />
      )}
    </div>
  );
}
