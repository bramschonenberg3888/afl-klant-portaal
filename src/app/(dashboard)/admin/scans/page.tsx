'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import { ScanHistory } from '@/components/quickscan/scan-history';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function AdminScansPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId;

  const { data } = trpc.quickscan.listForOrg.useQuery(
    { organizationId: orgId!, limit: 50 },
    { enabled: !!orgId }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scans Beheren</h1>
        <Button asChild>
          <Link href="/admin/scans/new">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe scan
          </Link>
        </Button>
      </div>

      {data?.scans && <ScanHistory scans={data.scans} />}
    </div>
  );
}
