import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersTable } from '@/components/admin/users-table';
import { UsageStats } from '@/components/admin/usage-stats';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Beheer</h1>
        <p className="text-muted-foreground">Beheer gebruikers en bekijk systeemstatistieken.</p>
      </div>

      <UsageStats />

      <Card>
        <CardHeader>
          <CardTitle>Gebruikers</CardTitle>
          <CardDescription>Overzicht van alle geregistreerde gebruikers.</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable />
        </CardContent>
      </Card>
    </div>
  );
}
