'use client';

import { use } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function PhotosPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = use(params);
  const { data: scan } = trpc.quickscan.getById.useQuery({ scanId });

  const allPhotos = scan?.findings.flatMap((f) =>
    f.photoUrls.map((url) => ({ url, findingTitle: f.title }))
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/quick-scan/${scanId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug naar scan
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Foto&apos;s ({allPhotos.length})</h1>
      </div>

      {allPhotos.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Geen foto&apos;s beschikbaar</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {allPhotos.map((photo, i) => (
            <Card key={i}>
              <CardContent className="p-2">
                <Image src={photo.url} alt={photo.findingTitle} width={400} height={400} className="w-full rounded-md object-cover aspect-square" />
                <p className="mt-2 text-xs text-muted-foreground truncate">{photo.findingTitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
