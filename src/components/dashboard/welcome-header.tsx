'use client';

import { useSession } from 'next-auth/react';

export function WelcomeHeader() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'Gebruiker';

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight">Welkom terug, {firstName}</h1>
      <p className="text-muted-foreground">
        Bekijk uw veiligheidsstatistieken en recent gestelde vragen.
      </p>
    </div>
  );
}
