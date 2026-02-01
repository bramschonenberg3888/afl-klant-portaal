'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import type { ActionPriority, Layer, Perspective } from '@/generated/prisma/client';

export default function NewActionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const organizationId = session?.user?.organizationId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [layer, setLayer] = useState<Layer | ''>('');
  const [perspective, setPerspective] = useState<Perspective | ''>('');
  const [priority, setPriority] = useState<ActionPriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const createAction = trpc.actions.create.useMutation({
    onSuccess: () => {
      router.push('/quick-scan?tab=acties');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId || !title.trim()) return;

    createAction.mutate({
      organizationId,
      title: title.trim(),
      description: description.trim() || undefined,
      layer: layer || undefined,
      perspective: perspective || undefined,
      priority,
      assigneeId: assigneeId.trim() || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    });
  }

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Geen organisatie gevonden. Log opnieuw in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/quick-scan?tab=acties">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nieuwe Actie Aanmaken</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Actie gegevens</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Beschrijf de actie in het kort..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uitgebreide beschrijving van wat er gedaan moet worden..."
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioriteit</Label>
                <Select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ActionPriority)}
                >
                  <option value="LOW">Laag</option>
                  <option value="MEDIUM">Gemiddeld</option>
                  <option value="HIGH">Hoog</option>
                  <option value="URGENT">Urgent</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Deadline</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="layer">Laag</Label>
                <Select
                  id="layer"
                  value={layer}
                  onChange={(e) => setLayer(e.target.value as Layer | '')}
                >
                  <option value="">Geen laag geselecteerd</option>
                  <option value="RUIMTE_INRICHTING">Ruimte &amp; Inrichting</option>
                  <option value="WERKWIJZE_PROCESSEN">Werkwijze &amp; Processen</option>
                  <option value="ORGANISATIE_BESTURING">Organisatie &amp; Besturing</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="perspective">Perspectief</Label>
                <Select
                  id="perspective"
                  value={perspective}
                  onChange={(e) => setPerspective(e.target.value as Perspective | '')}
                >
                  <option value="">Geen perspectief geselecteerd</option>
                  <option value="EFFICIENT">Effici&euml;nt</option>
                  <option value="VEILIG">Veilig</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigneeId">Toewijzen aan (gebruiker ID)</Label>
              <Input
                id="assigneeId"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                placeholder="Gebruiker ID van de verantwoordelijke..."
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={!title.trim() || createAction.isPending}>
                {createAction.isPending ? 'Aanmaken...' : 'Opslaan'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/quick-scan?tab=acties">Annuleren</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
