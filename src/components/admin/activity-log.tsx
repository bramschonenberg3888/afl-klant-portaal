'use client';

import { useState } from 'react';
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
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Aangemaakt',
  UPDATE: 'Bijgewerkt',
  DELETE: 'Verwijderd',
  STATUS_CHANGE: 'Status gewijzigd',
};

const RESOURCE_LABELS: Record<string, string> = {
  action: 'Actie',
  document: 'Document',
  quickscan: 'QuickScan',
  finding: 'Bevinding',
  roadmap_item: 'Routekaart',
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  STATUS_CHANGE: 'bg-amber-100 text-amber-800',
};

export function ActivityLog() {
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.audit.list.useInfiniteQuery(
      {
        limit: 50,
        resource: resourceFilter || undefined,
        action: actionFilter || undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const logs = data?.pages.flatMap((p) => p.logs) ?? [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="w-48"
        >
          <option value="">Alle bronnen</option>
          <option value="action">Acties</option>
          <option value="document">Documenten</option>
          <option value="quickscan">QuickScans</option>
          <option value="finding">Bevindingen</option>
          <option value="roadmap_item">Routekaart</option>
        </Select>
        <Select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-48"
        >
          <option value="">Alle acties</option>
          <option value="CREATE">Aangemaakt</option>
          <option value="UPDATE">Bijgewerkt</option>
          <option value="DELETE">Verwijderd</option>
          <option value="STATUS_CHANGE">Status gewijzigd</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Geen activiteiten gevonden.
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tijdstip</TableHead>
                <TableHead>Gebruiker</TableHead>
                <TableHead>Actie</TableHead>
                <TableHead>Bron</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                let details = '';
                if (log.details) {
                  try {
                    const parsed = JSON.parse(log.details);
                    if (parsed.title) details = parsed.title;
                    else if (parsed.from && parsed.to) details = `${parsed.from} → ${parsed.to}`;
                    else details = JSON.stringify(parsed).slice(0, 100);
                  } catch {
                    details = log.details.slice(0, 100);
                  }
                }

                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('nl-NL', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user.name ?? log.user.email ?? 'Onbekend'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] ${ACTION_COLORS[log.action] ?? ''}`}
                        variant="secondary"
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {RESOURCE_LABELS[log.resource] ?? log.resource}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {details}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Meer laden
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
