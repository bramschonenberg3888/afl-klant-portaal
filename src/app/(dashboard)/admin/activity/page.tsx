'use client';

import { ActivityLog } from '@/components/admin/activity-log';

export default function AdminActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activiteitenlog</h1>
        <p className="text-sm text-muted-foreground">
          Overzicht van alle acties uitgevoerd in het platform.
        </p>
      </div>
      <ActivityLog />
    </div>
  );
}
