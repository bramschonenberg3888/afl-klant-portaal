import { ProfileForm } from '@/components/settings/profile-form';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Instellingen</h1>
        <p className="text-muted-foreground">Beheer uw accountinstellingen en voorkeuren.</p>
      </div>
      <div className="max-w-2xl">
        <ProfileForm />
      </div>
    </div>
  );
}
