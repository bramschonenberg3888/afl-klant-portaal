'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { DocumentListSkeleton } from '@/components/skeletons/document-list-skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, FileText, Loader2 } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
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

  const { data, isLoading: docsLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.clientDocuments.list.useInfiniteQuery(
      {
        organizationId,
        category: activeCategory === 'ALL' ? undefined : (activeCategory as DocumentCategory),
        search: searchQuery || undefined,
        limit: 50,
      },
      {
        enabled: !!organizationId,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const sentinelRef = useInfiniteScroll(() => fetchNextPage(), {
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

  const documents = data?.pages.flatMap((p) => p.documents) ?? [];

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
            <DocumentListSkeleton />
          ) : documents.length > 0 ? (
            <div>
              <div className="grid gap-3 md:grid-cols-2">
                {documents.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-4" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
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
