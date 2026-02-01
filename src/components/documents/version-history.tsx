'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, User } from 'lucide-react';

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Version {
  id: string;
  version: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: Date | string;
  uploadedBy: { name: string | null } | null;
}

interface VersionHistoryProps {
  versions: Version[];
}

export function VersionHistory({ versions }: VersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Geen eerdere versies beschikbaar.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <div
          key={version.id}
          className="flex items-center justify-between gap-4 rounded-lg border p-3"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                v{version.version}
              </Badge>
              <span className="truncate text-sm font-medium">
                {version.fileName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatDate(version.createdAt)}</span>
              {version.uploadedBy?.name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {version.uploadedBy.name}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href={version.fileUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-1 h-3.5 w-3.5" />
              Downloaden
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
}
