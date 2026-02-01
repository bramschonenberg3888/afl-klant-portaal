'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QuoteRequestDialog } from './quote-request-dialog';

const LAYER_LABELS: Record<string, string> = {
  RUIMTE_INRICHTING: 'Ruimte & Inrichting',
  WERKWIJZE_PROCESSEN: 'Werkwijze & Processen',
  ORGANISATIE_BESTURING: 'Organisatie & Besturing',
};

interface RecommendationsPanelProps {
  scanId?: string;
  actionId?: string;
  organizationId?: string;
}

export function RecommendationsPanel({
  scanId,
  actionId,
  organizationId,
}: RecommendationsPanelProps) {
  const [quoteProductId, setQuoteProductId] = useState<string | undefined>(undefined);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  const scanRecommendations = trpc.products.getRecommendationsForScan.useQuery(
    { scanId: scanId! },
    { enabled: !!scanId }
  );

  const actionRecommendations = trpc.products.getRecommendationsForAction.useQuery(
    { actionId: actionId! },
    { enabled: !!actionId }
  );

  const isLoading = scanId ? scanRecommendations.isLoading : actionRecommendations.isLoading;
  const recommendations = scanId
    ? (scanRecommendations.data ?? [])
    : (actionRecommendations.data ?? []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aanbevolen Producten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-16 w-16 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const handleRequestQuote = (productId: string) => {
    setQuoteProductId(productId);
    setQuoteDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Aanbevolen Producten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="flex gap-3 rounded-lg border p-3">
              <Link
                href={`/products/${rec.product.id}`}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted"
              >
                {rec.product.imageUrl ? (
                  <Image
                    src={rec.product.imageUrl}
                    alt={rec.product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0 space-y-1">
                <Link
                  href={`/products/${rec.product.id}`}
                  className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
                >
                  {rec.product.name}
                </Link>
                {rec.product.layer && (
                  <Badge variant="secondary" className="text-xs">
                    {LAYER_LABELS[rec.product.layer] ?? rec.product.layer}
                  </Badge>
                )}
                {rec.context && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{rec.context}</p>
                )}
                {scanId &&
                  (rec as { finding?: { title?: string; description?: string } }).finding && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      Bevinding:{' '}
                      {(rec as { finding?: { title?: string; description?: string } }).finding!
                        .title ??
                        (rec as { finding?: { title?: string; description?: string } }).finding!
                          .description}
                    </p>
                  )}
                {rec.product.priceRange && (
                  <p className="text-xs font-medium text-primary">{rec.product.priceRange}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleRequestQuote(rec.product.id)}
                  >
                    Offerte
                  </Button>
                  <Button size="xs" variant="ghost" asChild>
                    <Link href={`/products/${rec.product.id}`}>
                      Bekijk
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <QuoteRequestDialog
        productId={quoteProductId}
        organizationId={organizationId}
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        trigger={<Button className="hidden">trigger</Button>}
      />
    </>
  );
}
