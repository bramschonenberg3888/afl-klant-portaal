'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatSkeleton } from '@/components/skeletons/chat-skeleton';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { trpc } from '@/trpc/client';

export function RecentChats() {
  const { data: conversations, isLoading } = trpc.chat.getConversations.useQuery();

  const recentConversations = conversations?.slice(0, 5) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recente gesprekken</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/chat">
            Alles bekijken
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChatSkeleton />
        ) : recentConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Nog geen gesprekken. Begin een nieuw gesprek met de Veiligheidsassistent.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/chat">Start een gesprek</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/chat?id=${conversation.id}`}
                className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {conversation.title || 'Nieuw gesprek'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.updatedAt), {
                      addSuffix: true,
                      locale: nl,
                    })}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
