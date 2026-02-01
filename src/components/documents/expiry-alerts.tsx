'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/trpc/client';
import Link from 'next/link';

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isExpired(expiresAt: Date | string): boolean {
  return new Date(expiresAt) <= new Date();
}

interface ExpiryAlertsProps {
  organizationId: string;
}

export function ExpiryAlerts({ organizationId }: ExpiryAlertsProps) {
  const { data: documents, isLoading } = trpc.clientDocuments.getExpiringSoon.useQuery(
    { organizationId, daysAhead: 30 },
    { enabled: !!organizationId }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base">Verloopt binnenkort</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map((doc) => {
            const expired = doc.expiresAt ? isExpired(doc.expiresAt) : false;
            return (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-accent',
                  expired
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.title}</p>
                  {doc.uploadedBy?.name && (
                    <p className="text-xs text-muted-foreground">{doc.uploadedBy.name}</p>
                  )}
                </div>
                <div
                  className={cn(
                    'flex shrink-0 items-center gap-1 text-xs font-medium',
                    expired
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {expired
                    ? 'Verlopen'
                    : doc.expiresAt
                      ? `Verloopt ${formatDate(doc.expiresAt)}`
                      : ''}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
