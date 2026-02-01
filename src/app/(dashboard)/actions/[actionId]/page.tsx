'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Edit,
  MessageSquare,
  Send,
  Trash2,
  User,
  Layers,
  Eye,
  Flag,
  LinkIcon,
} from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  LAYER_LABELS,
  PERSPECTIVE_LABELS,
} from '@/components/actions/action-card';
import type { ActionStatus, ActionPriority, Layer, Perspective } from '@/generated/prisma/client';

const STATUS_TRANSITIONS: Record<ActionStatus, ActionStatus[]> = {
  TODO: ['IN_PROGRESS', 'DEFERRED', 'CANCELLED'],
  IN_PROGRESS: ['DONE', 'TODO', 'DEFERRED', 'CANCELLED'],
  DONE: ['TODO', 'IN_PROGRESS'],
  DEFERRED: ['TODO', 'IN_PROGRESS', 'CANCELLED'],
  CANCELLED: ['TODO'],
};

export default function ActionDetailPage({ params }: { params: Promise<{ actionId: string }> }) {
  const { actionId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const organizationId = session?.user?.organizationId;
  const utils = trpc.useUtils();

  const [commentContent, setCommentContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<ActionPriority>('MEDIUM');
  const [editLayer, setEditLayer] = useState<Layer | ''>('');
  const [editPerspective, setEditPerspective] = useState<Perspective | ''>('');
  const [editDueDate, setEditDueDate] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: action, isLoading } = trpc.actions.getById.useQuery(
    { actionId, organizationId: organizationId! },
    { enabled: !!organizationId }
  );

  function startEditing() {
    if (!action) return;
    setEditTitle(action.title);
    setEditDescription(action.description ?? '');
    setEditPriority(action.priority);
    setEditLayer(action.layer ?? '');
    setEditPerspective(action.perspective ?? '');
    setEditDueDate(action.dueDate ? new Date(action.dueDate).toISOString().split('T')[0] : '');
    setIsEditing(true);
  }

  const updateStatus = trpc.actions.updateStatus.useMutation({
    onSuccess: () => {
      utils.actions.getById.invalidate();
      utils.actions.list.invalidate();
      utils.actions.getStats.invalidate();
    },
  });

  const updateAction = trpc.actions.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.actions.getById.invalidate();
      utils.actions.list.invalidate();
    },
  });

  const deleteAction = trpc.actions.delete.useMutation({
    onSuccess: () => {
      router.push('/quick-scan?tab=acties');
    },
  });

  const addComment = trpc.actions.addComment.useMutation({
    onSuccess: () => {
      setCommentContent('');
      utils.actions.getById.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!action) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Actie niet gevonden</p>
        <Button variant="outline" asChild>
          <Link href="/quick-scan?tab=acties">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug naar acties
          </Link>
        </Button>
      </div>
    );
  }

  const dueDate = action.dueDate ? new Date(action.dueDate) : null;
  const isOverdue =
    dueDate && dueDate < new Date() && action.status !== 'DONE' && action.status !== 'CANCELLED';
  const allowedTransitions = STATUS_TRANSITIONS[action.status] ?? [];

  function handleSaveEdit() {
    if (!organizationId) return;
    updateAction.mutate({
      organizationId,
      actionId,
      title: editTitle,
      description: editDescription || undefined,
      priority: editPriority,
      layer: editLayer || undefined,
      perspective: editPerspective || undefined,
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
    });
  }

  function handleSubmitComment() {
    if (!organizationId || !commentContent.trim()) return;
    addComment.mutate({
      organizationId,
      actionId,
      content: commentContent.trim(),
    });
  }

  function handleStatusChange(newStatus: ActionStatus) {
    if (!organizationId) return;
    updateStatus.mutate({ organizationId, actionId, status: newStatus });
  }

  function handleDelete() {
    if (!organizationId) return;
    deleteAction.mutate({ organizationId, actionId });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/quick-scan?tab=acties">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Actie Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (isEditing ? setIsEditing(false) : startEditing())}
          >
            <Edit className="mr-1 h-3 w-3" />
            {isEditing ? 'Annuleren' : 'Bewerken'}
          </Button>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-1 h-3 w-3" />
                Verwijderen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Actie verwijderen</DialogTitle>
                <DialogDescription>
                  Weet u zeker dat u deze actie wilt verwijderen? Dit kan niet ongedaan worden
                  gemaakt.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteAction.isPending}
                >
                  {deleteAction.isPending ? 'Verwijderen...' : 'Verwijderen'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Title, description, edit form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-lg font-bold"
                  />
                ) : (
                  action.title
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label>Beschrijving</Label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={5}
                      placeholder="Beschrijf de actie..."
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Prioriteit</Label>
                      <Select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as ActionPriority)}
                      >
                        <option value="LOW">Laag</option>
                        <option value="MEDIUM">Gemiddeld</option>
                        <option value="HIGH">Hoog</option>
                        <option value="URGENT">Urgent</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Deadline</Label>
                      <Input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Laag</Label>
                      <Select
                        value={editLayer}
                        onChange={(e) => setEditLayer(e.target.value as Layer | '')}
                      >
                        <option value="">Geen</option>
                        <option value="RUIMTE_INRICHTING">Ruimte &amp; Inrichting</option>
                        <option value="WERKWIJZE_PROCESSEN">Werkwijze &amp; Processen</option>
                        <option value="ORGANISATIE_BESTURING">Organisatie &amp; Besturing</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Perspectief</Label>
                      <Select
                        value={editPerspective}
                        onChange={(e) => setEditPerspective(e.target.value as Perspective | '')}
                      >
                        <option value="">Geen</option>
                        <option value="EFFICIENT">Effici&euml;nt</option>
                        <option value="VEILIG">Veilig</option>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveEdit}
                      disabled={updateAction.isPending || !editTitle}
                    >
                      {updateAction.isPending ? 'Opslaan...' : 'Opslaan'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Annuleren
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {action.description ? (
                    <p className="text-sm whitespace-pre-wrap">{action.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Geen beschrijving</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Linked finding */}
          {action.finding && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LinkIcon className="size-4" />
                  Gekoppelde bevinding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border p-3">
                  <p className="font-medium text-sm">{action.finding.title}</p>
                  {action.finding.cell && (
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">
                        {LAYER_LABELS[action.finding.cell.layer as Layer]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {PERSPECTIVE_LABELS[action.finding.cell.perspective as Perspective]}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="size-4" />
                Opmerkingen ({action.comments?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {action.comments && action.comments.length > 0 ? (
                <div className="space-y-4">
                  {action.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {comment.author?.name
                            ? comment.author.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {comment.author?.name ?? 'Onbekend'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nog geen opmerkingen</p>
              )}

              <Separator />

              <div className="flex gap-2">
                <Textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Schrijf een opmerking..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!commentContent.trim() || addComment.isPending}
                  className="self-end"
                >
                  <Send className="size-3 mr-1" />
                  {addComment.isPending ? 'Verzenden...' : 'Verstuur'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Eigenschappen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Flag className="size-3" />
                  Status
                </div>
                <Badge className={cn('text-xs', STATUS_COLORS[action.status])} variant="secondary">
                  {STATUS_LABELS[action.status]}
                </Badge>
                {allowedTransitions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {allowedTransitions.map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="xs"
                        onClick={() => handleStatusChange(status)}
                        disabled={updateStatus.isPending}
                        className="text-[10px]"
                      >
                        {STATUS_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Priority */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Flag className="size-3" />
                  Prioriteit
                </div>
                <p className="text-sm font-medium">{PRIORITY_LABELS[action.priority]}</p>
              </div>

              <Separator />

              {/* Assignee */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="size-3" />
                  Toegewezen aan
                </div>
                {action.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[10px]">
                        {action.assignee.name
                          ? action.assignee.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{action.assignee.name ?? 'Onbekend'}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Niet toegewezen</p>
                )}
              </div>

              <Separator />

              {/* Reporter */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="size-3" />
                  Aangemaakt door
                </div>
                <p className="text-sm">{action.reporter?.name ?? 'Onbekend'}</p>
              </div>

              <Separator />

              {/* Due date */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-3" />
                  Deadline
                </div>
                {dueDate ? (
                  <p className={cn('text-sm', isOverdue && 'text-red-600 font-medium')}>
                    {dueDate.toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {isOverdue && ' (verlopen)'}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Geen deadline</p>
                )}
              </div>

              {/* Layer */}
              {action.layer && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Layers className="size-3" />
                      Laag
                    </div>
                    <p className="text-sm">{LAYER_LABELS[action.layer]}</p>
                  </div>
                </>
              )}

              {/* Perspective */}
              {action.perspective && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="size-3" />
                      Perspectief
                    </div>
                    <p className="text-sm">{PERSPECTIVE_LABELS[action.perspective]}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Timestamps */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  Aangemaakt:{' '}
                  {new Date(action.createdAt).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p>
                  Bijgewerkt:{' '}
                  {new Date(action.updatedAt).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                {action.completedAt && (
                  <p>
                    Afgerond:{' '}
                    {new Date(action.completedAt).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
