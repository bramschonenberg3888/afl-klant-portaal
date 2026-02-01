'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Upload, Loader2 } from 'lucide-react';
import { trpc } from '@/trpc/client';
import type { DocumentCategory } from '@/generated/prisma/client';

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: 'QUICKSCAN_REPORT', label: 'QuickScan Rapport' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'SAFETY', label: 'Veiligheid' },
  { value: 'WORK_INSTRUCTIONS', label: 'Werkinstructies' },
  { value: 'CERTIFICATES', label: 'Certificaten' },
  { value: 'TRAINING', label: 'Trainingen' },
  { value: 'TEMPLATE', label: 'Sjablonen' },
  { value: 'OTHER', label: 'Overig' },
];

interface DocumentUploadFormProps {
  organizationId: string;
  onSuccess: () => void;
}

export function DocumentUploadForm({ organizationId, onSuccess }: DocumentUploadFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('OTHER');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);

  const uploadMutation = trpc.clientDocuments.upload.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !fileUrl.trim() || !fileName.trim() || !mimeType.trim()) {
      return;
    }

    uploadMutation.mutate({
      organizationId,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      fileUrl: fileUrl.trim(),
      fileName: fileName.trim(),
      fileSize: parseInt(fileSize, 10) || 0,
      mimeType: mimeType.trim(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      isTemplate,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <CardTitle>Document Uploaden</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv. RI&E Rapport 2025"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Korte beschrijving van het document..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categorie</Label>
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {/* File URL (MVP: manual URL input) */}
          <div className="space-y-2">
            <Label htmlFor="fileUrl">Bestand URL *</Label>
            <Input
              id="fileUrl"
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>

          {/* File metadata */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fileName">Bestandsnaam *</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="document.pdf"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileSize">Bestandsgrootte (bytes)</Label>
              <Input
                id="fileSize"
                type="number"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mimeType">MIME-type *</Label>
              <Input
                id="mimeType"
                value={mimeType}
                onChange={(e) => setMimeType(e.target.value)}
                placeholder="application/pdf"
                required
              />
            </div>
          </div>

          {/* Expiry date */}
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Verloopdatum</Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          {/* Is template */}
          <div className="flex items-center gap-2">
            <input
              id="isTemplate"
              type="checkbox"
              checked={isTemplate}
              onChange={(e) => setIsTemplate(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isTemplate">Dit is een sjabloon</Label>
          </div>

          {/* Error message */}
          {uploadMutation.error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Er is een fout opgetreden: {uploadMutation.error.message}
            </p>
          )}

          {/* Submit */}
          <Button type="submit" disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploaden...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Document Uploaden
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
