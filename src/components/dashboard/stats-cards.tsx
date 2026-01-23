'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, FileText, Users, HelpCircle } from 'lucide-react';
import { trpc } from '@/trpc/client';

export function StatsCards() {
  const { data: stats, isLoading } = trpc.admin.getDashboardStats.useQuery();

  const cards = [
    {
      title: 'Gesprekken',
      value: stats?.conversationCount ?? 0,
      icon: MessageSquare,
      description: 'Totaal aantal gesprekken',
    },
    {
      title: 'Vragen gesteld',
      value: stats?.messageCount ?? 0,
      icon: HelpCircle,
      description: 'Totaal aantal berichten',
    },
    {
      title: 'Documenten',
      value: stats?.documentCount ?? 0,
      icon: FileText,
      description: 'Kennisbank documenten',
    },
    {
      title: 'Gebruikers',
      value: stats?.userCount ?? 0,
      icon: Users,
      description: 'Actieve accounts',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{card.value}</div>
            )}
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
