'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X } from 'lucide-react';
import { trpc } from '@/trpc/client';
import type { QuickScanData } from './quickscan-hub';

interface TabManagementSummaryProps {
  scan: QuickScanData;
}

export function TabManagementSummary({ scan }: TabManagementSummaryProps) {
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.orgRole === 'ADMIN' || session?.user?.orgRole === 'CONSULTANT' ||
    session?.user?.globalRole === 'ADMIN';
  const orgId = session?.user?.organizationId;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(scan.managementSummary ?? '');
  const utils = trpc.useUtils();

  const updateSummary = trpc.quickscan.updateManagementSummary.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.quickscan.getLatest.invalidate();
    },
  });

  function handleSave() {
    if (!orgId) return;
    updateSummary.mutate({
      organizationId: orgId,
      scanId: scan.id,
      managementSummary: draft,
    });
  }

  function handleCancel() {
    setDraft(scan.managementSummary ?? '');
    setIsEditing(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Management Samenvatting</CardTitle>
        {isAdmin && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDraft(scan.managementSummary ?? '');
              setIsEditing(true);
            }}
          >
            <Edit className="mr-1 h-3.5 w-3.5" />
            Bewerken
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={10}
              placeholder="Schrijf een management samenvatting..."
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={updateSummary.isPending}>
                <Save className="mr-1 h-3.5 w-3.5" />
                {updateSummary.isPending ? 'Opslaan...' : 'Opslaan'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="mr-1 h-3.5 w-3.5" />
                Annuleren
              </Button>
            </div>
          </div>
        ) : scan.managementSummary ? (
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-sm">{scan.managementSummary}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nog geen management samenvatting beschikbaar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
