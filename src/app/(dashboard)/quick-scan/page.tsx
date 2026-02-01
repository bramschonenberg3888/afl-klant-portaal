'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import { QuickScanHub } from '@/components/quickscan/quickscan-hub';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function QuickScanPageContent() {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId;

  const { data: scan, isLoading } = trpc.quickscan.getLatest.useQuery(
    { organizationId: orgId! },
    { enabled: !!orgId }
  );

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-lg font-medium">Geen organisatie geselecteerd</p>
        <p className="text-sm text-muted-foreground">
          Selecteer een organisatie om uw QuickScan te bekijken.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardCheck className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-6 text-xl font-semibold">Nog geen QuickScan beschikbaar</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Er is nog geen QuickScan uitgevoerd voor uw organisatie. Neem contact op met uw consultant
          om een scan in te plannen.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/chat">
            Stel een vraag aan de assistent
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return <QuickScanHub scan={scan} orgName={scan.organization?.name} />;
}

export default function QuickScanPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      }
    >
      <QuickScanPageContent />
    </Suspense>
  );
}
