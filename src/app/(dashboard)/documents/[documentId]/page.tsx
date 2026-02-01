'use client';

import { use } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { DocumentDetail } from '@/components/documents/document-detail';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = use(params);
  const { data: document, isLoading } = trpc.clientDocuments.getById.useQuery({
    documentId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-lg font-medium">Document niet gevonden</p>
        <p className="text-sm text-muted-foreground">
          Het opgevraagde document bestaat niet of is verwijderd.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar documenten
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/documents">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Details</h1>
        </div>
      </div>

      {/* Document detail with version history */}
      <DocumentDetail document={document} />
    </div>
  );
}
