'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MessageSquare } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NEW: { label: 'Nieuw', className: 'bg-blue-100 text-blue-800' },
  CONTACTED: { label: 'Gecontacteerd', className: 'bg-yellow-100 text-yellow-800' },
  QUOTED: { label: 'Offerte verzonden', className: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Gesloten', className: 'bg-gray-100 text-gray-800' },
};

type QuoteStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'CLOSED';

export default function AdminQuotesPage() {
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | ''>('');

  const { data: quotes, isLoading } = trpc.products.listQuoteRequests.useQuery({
    status: (statusFilter || undefined) as QuoteStatus | undefined,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Offerteaanvragen</h1>
        <p className="text-muted-foreground">Beheer binnengekomen offerteaanvragen.</p>
      </div>

      <div className="flex gap-2">
        <Badge
          variant={statusFilter === '' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setStatusFilter('')}
        >
          Alle
        </Badge>
        {(Object.entries(STATUS_CONFIG) as [QuoteStatus, { label: string }][]).map(
          ([status, config]) => (
            <Badge
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter(status)}
            >
              {config.label}
            </Badge>
          )
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Aanvragen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !quotes || quotes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Geen offerteaanvragen gevonden.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Organisatie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Bericht</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => {
                  const statusInfo = STATUS_CONFIG[quote.status] ?? {
                    label: quote.status,
                    className: 'bg-gray-100 text-gray-800',
                  };

                  return (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quote.contactName}</p>
                          <p className="text-xs text-muted-foreground">{quote.contactEmail}</p>
                          {quote.contactPhone && (
                            <p className="text-xs text-muted-foreground">{quote.contactPhone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {quote.product ? (
                          <span className="text-sm">{quote.product.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {quote.organization ? (
                          <span className="text-sm">{quote.organization.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusInfo.className}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(quote.createdAt).toLocaleDateString('nl-NL')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {quote.message ? (
                          <p className="max-w-xs truncate text-sm">{quote.message}</p>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
