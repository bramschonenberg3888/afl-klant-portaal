'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Download,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  Layers,
  Tag,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VersionHistory } from './version-history';
import {
  CATEGORY_LABELS,
  formatFileSize,
  formatDate,
  getExpiryStatus,
} from './document-card';
import type { DocumentCategory } from '@/generated/prisma/client';

interface Version {
  id: string;
  version: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: Date | string;
  uploadedBy: { name: string | null } | null;
}

interface DocumentDetailDocument {
  id: string;
  title: string;
  description: string | null;
  category: DocumentCategory;
  mimeType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  expiresAt: Date | string | null;
  isTemplate: boolean;
  uploadedBy: { name: string | null } | null;
  organization: { name: string } | null;
  versions: Version[];
}

interface DocumentDetailProps {
  document: DocumentDetailDocument;
}

export function DocumentDetail({ document }: DocumentDetailProps) {
  const expiryStatus = getExpiryStatus(document.expiresAt);

  return (
    <div className="space-y-6">
      {/* Main info card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>{document.title}</CardTitle>
              </div>
              {document.description && (
                <p className="text-sm text-muted-foreground">
                  {document.description}
                </p>
              )}
            </div>
            <Button asChild>
              <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Downloaden
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Categorie:</span>
              <Badge variant="secondary">
                {CATEGORY_LABELS[document.category]}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Bestandsnaam:</span>
              <span className="truncate font-medium">{document.fileName}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Grootte:</span>
              <span className="font-medium">{formatFileSize(document.fileSize)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Geupload:</span>
              <span className="font-medium">{formatDate(document.createdAt)}</span>
            </div>

            {document.uploadedBy?.name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Door:</span>
                <span className="font-medium">{document.uploadedBy.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Versie:</span>
              <span className="font-medium">v{document.version}</span>
            </div>

            {document.expiresAt && (
              <div className="flex items-center gap-2 text-sm">
                {expiryStatus ? (
                  <AlertTriangle
                    className={cn(
                      'h-4 w-4',
                      expiryStatus === 'expired'
                        ? 'text-red-500'
                        : 'text-amber-500'
                    )}
                  />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">Verloopt:</span>
                <span
                  className={cn(
                    'font-medium',
                    expiryStatus === 'expired' && 'text-red-600 dark:text-red-400',
                    expiryStatus === 'warning' && 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  {formatDate(document.expiresAt)}
                  {expiryStatus === 'expired' && ' (Verlopen)'}
                </span>
              </div>
            )}

            {document.isTemplate && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">Sjabloon</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Version history */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle>Versiegeschiedenis</CardTitle>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <VersionHistory versions={document.versions} />
        </CardContent>
      </Card>
    </div>
  );
}
