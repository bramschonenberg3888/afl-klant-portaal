'use client';

import { useState, useMemo } from 'react';
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

/** Parse plain-text summary into sections based on ALL-CAPS headings. */
function parseSections(text: string): { heading: string | null; body: string }[] {
  const lines = text.split('\n');
  const sections: { heading: string | null; body: string }[] = [];
  let current: { heading: string | null; lines: string[] } = { heading: null, lines: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    // Detect ALL-CAPS section headings (at least 3 word chars, may contain parentheses)
    if (trimmed.length > 0 && /^[A-ZÀÁÂÃÄÉÈÊËÏÍÎÓÔÕÖÚÙÛÜÇÑ\s&\-()]+$/.test(trimmed) && trimmed.length >= 8) {
      if (current.heading !== null || current.lines.some((l) => l.trim())) {
        sections.push({ heading: current.heading, body: current.lines.join('\n').trim() });
      }
      current = { heading: trimmed, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.heading !== null || current.lines.some((l) => l.trim())) {
    sections.push({ heading: current.heading, body: current.lines.join('\n').trim() });
  }
  return sections;
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

  const sections = useMemo(
    () => (scan.managementSummary ? parseSections(scan.managementSummary) : []),
    [scan.managementSummary],
  );

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
              rows={16}
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
        ) : sections.length > 0 ? (
          <div className="space-y-5">
            {sections.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-primary mb-2">
                    {section.heading}
                  </h3>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              </div>
            ))}
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
