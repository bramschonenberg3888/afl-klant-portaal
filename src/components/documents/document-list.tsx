'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, FileText } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { DocumentCard, CATEGORY_LABELS } from './document-card';
import type { DocumentCategory } from '@/generated/prisma/client';

const ALL_CATEGORIES: DocumentCategory[] = [
  'QUICKSCAN_REPORT',
  'COMPLIANCE',
  'SAFETY',
  'WORK_INSTRUCTIONS',
  'CERTIFICATES',
  'TRAINING',
  'TEMPLATE',
  'OTHER',
];

interface DocumentListProps {
  organizationId: string;
}

export function DocumentList({ organizationId }: DocumentListProps) {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categoryCounts, isLoading: countsLoading } =
    trpc.clientDocuments.getByCategory.useQuery({ organizationId }, { enabled: !!organizationId });

  const { data: documentsData, isLoading: docsLoading } = trpc.clientDocuments.list.useQuery(
    {
      organizationId,
      category: activeCategory === 'ALL' ? undefined : (activeCategory as DocumentCategory),
      search: searchQuery || undefined,
    },
    { enabled: !!organizationId }
  );

  const countMap = new Map<string, number>();
  let totalCount = 0;
  if (categoryCounts) {
    for (const c of categoryCounts) {
      countMap.set(c.category, c.count);
      totalCount += c.count;
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Zoek documenten..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex w-full flex-wrap gap-1">
          <TabsTrigger value="ALL">
            Alle
            {!countsLoading && (
              <span className="ml-1 text-xs text-muted-foreground">({totalCount})</span>
            )}
          </TabsTrigger>
          {ALL_CATEGORIES.map((cat) => {
            const count = countMap.get(cat) ?? 0;
            if (count === 0 && !countsLoading) return null;
            return (
              <TabsTrigger key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
                {!countsLoading && (
                  <span className="ml-1 text-xs text-muted-foreground">({count})</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Shared content for all tabs */}
        <TabsContent value={activeCategory} className="mt-4">
          {docsLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : documentsData?.documents && documentsData.documents.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {documentsData.documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm font-medium">Geen documenten gevonden</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? 'Probeer een andere zoekterm.'
                  : 'Er zijn nog geen documenten in deze categorie.'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
