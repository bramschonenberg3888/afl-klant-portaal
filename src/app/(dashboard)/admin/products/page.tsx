'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

type LayerValue = 'RUIMTE_INRICHTING' | 'WERKWIJZE_PROCESSEN' | 'ORGANISATIE_BESTURING';

interface ProductFormState {
  name: string;
  description: string;
  sku: string;
  category: string;
  layer: string;
  imageUrl: string;
  productUrl: string;
  priceRange: string;
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  description: '',
  sku: '',
  category: '',
  layer: '',
  imageUrl: '',
  productUrl: '',
  priceRange: '',
};

export default function AdminProductsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.products.list.useQuery({ limit: 100 });

  const createProduct = trpc.products.createProduct.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      handleCloseDialog();
    },
  });

  const updateProduct = trpc.products.updateProduct.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      handleCloseDialog();
    },
  });

  const deleteProduct = trpc.products.deleteProduct.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      setDeleteConfirmId(null);
    },
  });

  const products = data?.products ?? [];

  const handleOpenCreate = () => {
    setForm(EMPTY_FORM);
    setEditProductId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (product: (typeof products)[number]) => {
    setForm({
      name: product.name,
      description: product.description ?? '',
      sku: product.sku ?? '',
      category: product.category ?? '',
      layer: product.layer ?? '',
      imageUrl: product.imageUrl ?? '',
      productUrl: product.productUrl ?? '',
      priceRange: product.priceRange ?? '',
    });
    setEditProductId(product.id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditProductId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      description: form.description || undefined,
      sku: form.sku || undefined,
      category: form.category || undefined,
      layer: (form.layer || undefined) as LayerValue | undefined,
      imageUrl: form.imageUrl || undefined,
      productUrl: form.productUrl || undefined,
      priceRange: form.priceRange || undefined,
    };

    if (editProductId) {
      updateProduct.mutate({ productId: editProductId, ...payload });
    } else {
      createProduct.mutate(payload);
    }
  };

  const updateField = (field: keyof ProductFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Producten Beheren</h1>
          <p className="text-muted-foreground">
            Beheer het productaanbod en koppel producten aan bevindingen.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nieuw Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Producten ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nog geen producten aangemaakt.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Laag</TableHead>
                  <TableHead>Prijs</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="secondary">{product.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.layer ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            'border-transparent text-xs',
                            LAYER_COLORS[product.layer]
                          )}
                        >
                          {LAYER_LABELS[product.layer] ?? product.layer}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.priceRange ? (
                        <span className="text-sm font-medium">{product.priceRange}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {product.sku || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleOpenEdit(product)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteConfirmId(product.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editProductId ? 'Product Bewerken' : 'Nieuw Product'}
            </DialogTitle>
            <DialogDescription>
              {editProductId
                ? 'Pas de productgegevens aan.'
                : 'Voeg een nieuw product toe aan het aanbod.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Naam *</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Productnaam"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Beschrijving</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Productbeschrijving..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-sku">SKU</Label>
                <Input
                  id="product-sku"
                  value={form.sku}
                  onChange={(e) => updateField('sku', e.target.value)}
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category">Categorie</Label>
                <Input
                  id="product-category"
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  placeholder="Bijv. Stellingen"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-layer">Laag</Label>
                <Select
                  id="product-layer"
                  value={form.layer}
                  onChange={(e) => updateField('layer', e.target.value)}
                >
                  <option value="">Geen laag</option>
                  <option value="RUIMTE_INRICHTING">Ruimte &amp; Inrichting</option>
                  <option value="WERKWIJZE_PROCESSEN">Werkwijze &amp; Processen</option>
                  <option value="ORGANISATIE_BESTURING">Organisatie &amp; Besturing</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Prijsindicatie</Label>
                <Input
                  id="product-price"
                  value={form.priceRange}
                  onChange={(e) => updateField('priceRange', e.target.value)}
                  placeholder="Bijv. &euro;500 - &euro;1.500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-imageUrl">Afbeelding URL</Label>
              <Input
                id="product-imageUrl"
                type="url"
                value={form.imageUrl}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-productUrl">Product URL</Label>
              <Input
                id="product-productUrl"
                type="url"
                value={form.productUrl}
                onChange={(e) => updateField('productUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={createProduct.isPending || updateProduct.isPending}
              >
                {createProduct.isPending || updateProduct.isPending
                  ? 'Opslaan...'
                  : editProductId
                    ? 'Bijwerken'
                    : 'Aanmaken'}
              </Button>
            </DialogFooter>

            {(createProduct.isError || updateProduct.isError) && (
              <p className="text-sm text-destructive text-center">
                Er is een fout opgetreden. Probeer het opnieuw.
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(isOpen) => !isOpen && setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Verwijderen</DialogTitle>
            <DialogDescription>
              Weet u zeker dat u dit product wilt verwijderen? Deze actie kan niet ongedaan worden
              gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Annuleren
            </Button>
            <Button
              variant="destructive"
              disabled={deleteProduct.isPending}
              onClick={() => {
                if (deleteConfirmId) {
                  deleteProduct.mutate({ productId: deleteConfirmId });
                }
              }}
            >
              {deleteProduct.isPending ? 'Verwijderen...' : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
