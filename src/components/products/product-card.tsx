'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Package, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    category?: string | null;
    layer?: string | null;
    imageUrl?: string | null;
    productUrl?: string | null;
    priceRange?: string | null;
  };
  onRequestQuote?: () => void;
}

export function ProductCard({ product, onRequestQuote }: ProductCardProps) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/3] w-full bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
        </div>
      </Link>
      <CardContent className="space-y-3 pt-4">
        <div className="flex flex-wrap gap-1.5">
          {product.category && (
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
          )}
          {product.layer && (
            <Badge
              variant="outline"
              className={cn('text-xs border-transparent', LAYER_COLORS[product.layer])}
            >
              {LAYER_LABELS[product.layer] ?? product.layer}
            </Badge>
          )}
        </div>

        <Link href={`/products/${product.id}`} className="block">
          <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        )}

        {product.priceRange && (
          <p className="text-sm font-medium text-primary">{product.priceRange}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" className="flex-1" onClick={onRequestQuote}>
            Offerte Aanvragen
          </Button>
          {product.productUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
