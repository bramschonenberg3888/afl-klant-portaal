'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DocumentList } from '@/components/documents/document-list';
import { ExpiryAlerts } from '@/components/documents/expiry-alerts';
import { FileText, Upload } from 'lucide-react';

export default function DocumentsPage() {
  const { data: session } = useSession();
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-lg font-medium">Geen organisatie geselecteerd</p>
        <p className="text-sm text-muted-foreground">
          Selecteer een organisatie om uw documenten te bekijken.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Documenten</h1>
          <p className="text-muted-foreground">Beheer en bekijk uw organisatiedocumenten.</p>
        </div>
        <Button asChild>
          <Link href="/documents/upload">
            <Upload className="mr-2 h-4 w-4" />
            Document Uploaden
          </Link>
        </Button>
      </div>

      {/* Expiry alerts */}
      <ExpiryAlerts organizationId={organizationId} />

      {/* Document list with category tabs and search */}
      <DocumentList organizationId={organizationId} />
    </div>
  );
}
