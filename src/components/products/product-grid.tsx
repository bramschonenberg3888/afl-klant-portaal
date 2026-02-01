'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from './product-card';
import { QuoteRequestDialog } from './quote-request-dialog';
import { Button } from '@/components/ui/button';

const LAYER_OPTIONS = [
  { value: 'ALL', label: 'Alle' },
  { value: 'RUIMTE_INRICHTING', label: 'Ruimte & Inrichting' },
  { value: 'WERKWIJZE_PROCESSEN', label: 'Werkwijze & Processen' },
  { value: 'ORGANISATIE_BESTURING', label: 'Organisatie & Besturing' },
] as const;

interface ProductGridProps {
  initialLayer?: string;
  initialCategory?: string;
  organizationId?: string;
}

export function ProductGrid({ initialLayer, initialCategory, organizationId }: ProductGridProps) {
  const [activeLayer, setActiveLayer] = useState<string>(initialLayer ?? 'ALL');
  const [category, setCategory] = useState<string>(initialCategory ?? '');
  const [search, setSearch] = useState('');
  const [quoteProductId, setQuoteProductId] = useState<string | undefined>(undefined);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  const layerFilter =
    activeLayer === 'ALL'
      ? undefined
      : (activeLayer as 'RUIMTE_INRICHTING' | 'WERKWIJZE_PROCESSEN' | 'ORGANISATIE_BESTURING');

  const { data, isLoading } = trpc.products.list.useQuery({
    layer: layerFilter,
    category: category || undefined,
    search: search || undefined,
  });

  const allProducts = data?.products ?? [];

  // Extract unique categories from products for the filter dropdown
  const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))] as string[];

  const handleRequestQuote = (productId: string) => {
    setQuoteProductId(productId);
    setQuoteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeLayer} onValueChange={setActiveLayer}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            {LAYER_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-3">
            {categories.length > 0 && (
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-48"
              >
                <option value="">Alle categorie&euml;n</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            )}

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Zoeken..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-56"
              />
            </div>
          </div>
        </div>

        {LAYER_OPTIONS.map((option) => (
          <TabsContent key={option.value} value={option.value}>
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : allProducts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Geen producten gevonden.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {allProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onRequestQuote={() => handleRequestQuote(product.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <QuoteRequestDialog
        productId={quoteProductId}
        organizationId={organizationId}
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        trigger={<Button className="hidden">trigger</Button>}
      />
    </div>
  );
}
