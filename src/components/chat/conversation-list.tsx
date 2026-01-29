'use client';

import { useState } from 'react';
import { formatDistanceToNow, isToday, isYesterday, differenceInDays, startOfDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { trpc } from '@/trpc/client';

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string | Date;
}

interface DateGroup {
  label: string;
  conversations: Conversation[];
}

function groupConversationsByDate(conversations: Conversation[]): DateGroup[] {
  const groups: Record<string, Conversation[]> = {
    Vandaag: [],
    Gisteren: [],
    'Afgelopen 7 dagen': [],
    'Afgelopen 30 dagen': [],
    Ouder: [],
  };

  const now = startOfDay(new Date());

  for (const conv of conversations) {
    const date = new Date(conv.updatedAt);
    if (isToday(date)) {
      groups['Vandaag'].push(conv);
    } else if (isYesterday(date)) {
      groups['Gisteren'].push(conv);
    } else if (differenceInDays(now, startOfDay(date)) <= 7) {
      groups['Afgelopen 7 dagen'].push(conv);
    } else if (differenceInDays(now, startOfDay(date)) <= 30) {
      groups['Afgelopen 30 dagen'].push(conv);
    } else {
      groups['Ouder'].push(conv);
    }
  }

  const order = ['Vandaag', 'Gisteren', 'Afgelopen 7 dagen', 'Afgelopen 30 dagen', 'Ouder'];
  return order
    .filter((label) => groups[label].length > 0)
    .map((label) => ({ label, conversations: groups[label] }));
}

interface ConversationListProps {
  activeId?: string;
  // eslint-disable-next-line no-unused-vars
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function ConversationList({ activeId, onSelect, onNewChat }: ConversationListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: conversations } = trpc.chat.getConversations.useQuery();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.chat.deleteConversation.useMutation({
    onSuccess: (_data, variables) => {
      utils.chat.getConversations.invalidate();
      setDeleteId(null);
      if (activeId === variables.id) {
        onNewChat();
      }
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId });
    }
  };

  const groups = conversations ? groupConversationsByDate(conversations as Conversation[]) : [];

  return (
    <div className="flex flex-col h-full min-h-0 border-r">
      <div className="p-3 border-b">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onNewChat}
        >
          <MessageSquarePlus className="h-4 w-4" />
          Nieuw gesprek
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-0.5 p-2">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {group.label}
              </div>
              {group.conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(conversation.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(conversation.id);
                    }
                  }}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted cursor-pointer group',
                    activeId === conversation.id && 'bg-muted'
                  )}
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1 overflow-hidden">
                    <span className="truncate font-medium">
                      {conversation.title || 'Nieuw gesprek'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {formatDistanceToNow(new Date(conversation.updatedAt), {
                        addSuffix: true,
                        locale: nl,
                      })}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => handleDeleteClick(e, conversation.id)}
                    title="Verwijder gesprek"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          ))}

          {conversations?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nog geen gesprekken
            </p>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gesprek verwijderen?</DialogTitle>
            <DialogDescription>
              Dit kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
