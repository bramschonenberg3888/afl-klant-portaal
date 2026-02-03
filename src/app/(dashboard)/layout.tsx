import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AuthSessionProvider } from '@/components/auth/session-provider';
import { DashboardHeader } from '@/components/layout/dashboard-header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AuthSessionProvider session={session}>
      <div className="flex min-h-svh flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </AuthSessionProvider>
  );
}
