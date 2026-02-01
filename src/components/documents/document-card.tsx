'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  FileArchive,
  Clock,
  AlertTriangle,
  User,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentCategory } from '@/generated/prisma/client';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  QUICKSCAN_REPORT: 'QuickScan Rapport',
  COMPLIANCE: 'Compliance',
  SAFETY: 'Veiligheid',
  WORK_INSTRUCTIONS: 'Werkinstructies',
  CERTIFICATES: 'Certificaten',
  TRAINING: 'Trainingen',
  TEMPLATE: 'Sjablonen',
  OTHER: 'Overig',
};

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word')) {
    return <FileText className={className} />;
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
    return <FileSpreadsheet className={className} />;
  }
  if (mimeType.includes('image')) {
    return <FileImage className={className} />;
  }
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) {
    return <FileArchive className={className} />;
  }
  return <File className={className} />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getExpiryStatus(
  expiresAt: Date | string | null | undefined
): 'expired' | 'warning' | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  if (expiry <= now) return 'expired';
  const daysUntil = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntil <= 30) return 'warning';
  return null;
}

interface DocumentCardDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  mimeType: string;
  fileSize: number;
  createdAt: Date | string;
  expiresAt: Date | string | null;
  uploadedBy: { name: string | null } | null;
  _count: { versions: number };
}

interface DocumentCardProps {
  document: DocumentCardDocument;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const expiryStatus = getExpiryStatus(document.expiresAt);

  return (
    <Link href={`/documents/${document.id}`}>
      <Card className="group cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="flex items-start gap-4 py-4">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              expiryStatus === 'expired'
                ? 'bg-red-100 dark:bg-red-900/30'
                : expiryStatus === 'warning'
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-primary/10'
            )}
          >
            <FileIcon
              mimeType={document.mimeType}
              className={cn(
                'h-5 w-5',
                expiryStatus === 'expired'
                  ? 'text-red-600 dark:text-red-400'
                  : expiryStatus === 'warning'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-primary'
              )}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-sm font-medium group-hover:text-primary">
                {document.title}
              </h3>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {CATEGORY_LABELS[document.category]}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{formatFileSize(document.fileSize)}</span>
              <span>{formatDate(document.createdAt)}</span>
              {document.uploadedBy?.name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {document.uploadedBy.name}
                </span>
              )}
              {document._count.versions > 0 && (
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {document._count.versions + 1} versies
                </span>
              )}
            </div>

            {expiryStatus && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  expiryStatus === 'expired'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'
                )}
              >
                <AlertTriangle className="h-3 w-3" />
                {expiryStatus === 'expired' ? (
                  'Verlopen'
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    Verloopt {formatDate(document.expiresAt!)}
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export { CATEGORY_LABELS, formatFileSize, formatDate, getExpiryStatus };
