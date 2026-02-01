'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewScanPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId;
  const [title, setTitle] = useState('');

  const createScan = trpc.quickscan.create.useMutation({
    onSuccess: (scan) => {
      if (scan) {
        router.push(`/admin/scans/${scan.id}/edit`);
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/scans">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nieuwe QuickScan</h1>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Scan aanmaken</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="bijv. QuickScan Q1 2026"
            />
          </div>
          <Button
            onClick={() => {
              if (orgId && title) {
                createScan.mutate({
                  organizationId: orgId,
                  title,
                  consultantId: session?.user?.id,
                });
              }
            }}
            disabled={!title || createScan.isPending}
          >
            {createScan.isPending ? 'Aanmaken...' : 'Scan aanmaken'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
