'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DocumentUploadForm } from '@/components/documents/document-upload-form';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

export default function DocumentUploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-lg font-medium">Geen organisatie geselecteerd</p>
        <p className="text-sm text-muted-foreground">
          Selecteer een organisatie om documenten te uploaden.
        </p>
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
          <h1 className="text-2xl font-bold tracking-tight">Document Uploaden</h1>
        </div>
      </div>

      {/* Upload form */}
      <DocumentUploadForm
        organizationId={organizationId}
        onSuccess={() => router.push('/documents')}
      />
    </div>
  );
}
