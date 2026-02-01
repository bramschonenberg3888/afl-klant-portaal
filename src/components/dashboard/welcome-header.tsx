'use client';

import { useSession } from 'next-auth/react';

export function WelcomeHeader() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'Gebruiker';

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight">Welkom terug, {firstName}</h1>
      <p className="text-muted-foreground">
        Welkom bij Magazijn op Maat — het portaal van Logistiekconcurrent waar u werkt aan een
        veiliger, efficiënter en volledig compliant magazijn. Van QuickScan-resultaten en actieplannen
        tot documentbeheer, benchmarking en persoonlijk advies van uw consultant.
      </p>
    </div>
  );
}
