'use client';

import { useSession } from 'next-auth/react';
import { Shield } from 'lucide-react';

export function WelcomeHeader() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'Gebruiker';

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
      <div className="flex items-start gap-4">
        <Shield className="h-8 w-8 text-primary mt-0.5 shrink-0" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Welkom terug, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Magazijn op Maat</strong> is een initiatief van{' '}
            <strong className="text-foreground">Logistiekconcurrent</strong>. In vier dagen
            voert een ervaren en onafhankelijke logistiek consultant een QuickScan uit van uw magazijn.
            U ontvangt concrete bevindingen, een prioriteitenmatrix en een routekaart
            met verbeteracties die u direct kunt oppakken.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Via dit portaal volgt u de voortgang van acties, beheert u documenten en
            certificaten, vergelijkt u uw scores met andere organisaties en krijgt u
            direct antwoord op vragen via de AI-veiligheidsassistent.
          </p>
        </div>
      </div>
    </div>
  );
}
