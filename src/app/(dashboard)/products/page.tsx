'use client';

import { useSession } from 'next-auth/react';
import { ShoppingBag } from 'lucide-react';
import { ProductGrid } from '@/components/products/product-grid';

export default function ProductsPage() {
  const { data: session } = useSession();
  const organizationId = session?.user?.organizationId;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Producten</h1>
        </div>
        <p className="text-muted-foreground">
          Ontdek oplossingen voor magazijnveiligheid, inrichting en compliance.
        </p>
      </div>

      <ProductGrid organizationId={organizationId ?? undefined} />
    </div>
  );
}
