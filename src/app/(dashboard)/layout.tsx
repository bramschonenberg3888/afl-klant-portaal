import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SessionProvider } from 'next-auth/react';
import { DashboardHeader } from '@/components/layout/dashboard-header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-svh flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </SessionProvider>
  );
}
