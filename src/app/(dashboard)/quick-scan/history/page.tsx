'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import { ScanHistory } from '@/components/quickscan/scan-history';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ScanHistoryPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId;

  const { data } = trpc.quickscan.listForOrg.useQuery(
    { organizationId: orgId!, limit: 50 },
    { enabled: !!orgId }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/quick-scan">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Scan Geschiedenis</h1>
      </div>

      {data?.scans && <ScanHistory scans={data.scans} />}
    </div>
  );
}
