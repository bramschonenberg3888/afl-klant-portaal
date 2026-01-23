import { WelcomeHeader } from '@/components/dashboard/welcome-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentChats } from '@/components/dashboard/recent-chats';
import { ShortcutButtons } from '@/components/dashboard/shortcut-buttons';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <WelcomeHeader />
      <StatsCards />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentChats />
        <ShortcutButtons />
      </div>
    </div>
  );
}
