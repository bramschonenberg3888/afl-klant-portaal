'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, FileText, Database } from 'lucide-react';
import { trpc } from '@/trpc/client';

export function UsageStats() {
  const { data: stats, isLoading } = trpc.admin.getDashboardStats.useQuery();

  const statItems = [
    {
      label: 'Totaal gebruikers',
      value: stats?.userCount ?? 0,
      icon: Users,
    },
    {
      label: 'Totaal gesprekken',
      value: stats?.conversationCount ?? 0,
      icon: MessageSquare,
    },
    {
      label: 'Documenten',
      value: stats?.documentCount ?? 0,
      icon: FileText,
    },
    {
      label: 'Document chunks',
      value: stats?.chunkCount ?? 0,
      icon: Database,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Systeemstatistieken</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-6 w-12 mb-1" />
                ) : (
                  <p className="text-xl font-bold">{item.value}</p>
                )}
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
