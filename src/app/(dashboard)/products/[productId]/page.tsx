'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Package, ExternalLink, Tag, Layers, Info } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { QuoteRequestDialog } from '@/components/products/quote-request-dialog';
import { cn } from '@/lib/utils';

const LAYER_LABELS: Record<string, string> = {
  RUIMTE_INRICHTING: 'Ruimte & Inrichting',
  WERKWIJZE_PROCESSEN: 'Werkwijze & Processen',
  ORGANISATIE_BESTURING: 'Organisatie & Besturing',
};

const LAYER_COLORS: Record<string, string> = {
  RUIMTE_INRICHTING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  WERKWIJZE_PROCESSEN: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  ORGANISATIE_BESTURING: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const { data: session } = useSession();
  const organizationId = session?.user?.organizationId;
  const [_quoteOpen, setQuoteOpen] = useState(false);

  const { data: product, isLoading } = trpc.products.getById.useQuery({ productId });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="py-12 text-center text-muted-foreground">Product niet gevonden.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/products">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug naar Producten
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-20 w-20 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {product.category && (
                <Badge variant="secondary">
                  <Tag className="mr-1 h-3 w-3" />
                  {product.category}
                </Badge>
              )}
              {product.layer && (
                <Badge
                  variant="outline"
                  className={cn('border-transparent', LAYER_COLORS[product.layer])}
                >
                  <Layers className="mr-1 h-3 w-3" />
                  {LAYER_LABELS[product.layer] ?? product.layer}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

            {product.sku && <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>}

            {product.priceRange && (
              <p className="text-xl font-semibold text-primary">{product.priceRange}</p>
            )}
          </div>

          <Separator />

          {product.description && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Beschrijving
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <QuoteRequestDialog
              productId={product.id}
              organizationId={organizationId ?? undefined}
              productName={product.name}
              open={_quoteOpen}
              onOpenChange={setQuoteOpen}
              trigger={<Button size="lg">Offerte Aanvragen</Button>}
            />
            {product.productUrl && (
              <Button variant="outline" size="lg" asChild>
                <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Productpagina
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Linked Recommendations */}
      {product.recommendations && product.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Gerelateerde Bevindingen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {product.recommendations.map((rec) => (
                <div key={rec.id} className="rounded-lg border p-3 space-y-1">
                  {rec.finding && (
                    <p className="text-sm font-medium">
                      {rec.finding.title ?? rec.finding.description}
                    </p>
                  )}
                  {rec.action && (
                    <p className="text-sm font-medium">
                      {rec.action.title ?? rec.action.description}
                    </p>
                  )}
                  {rec.context && <p className="text-xs text-muted-foreground">{rec.context}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
