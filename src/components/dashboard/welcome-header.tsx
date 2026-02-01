'use client';

import { useSession } from 'next-auth/react';
import { Warehouse, Cog, Users } from 'lucide-react';

const assessmentAspects = [
  {
    icon: Warehouse,
    name: 'Ruimte & Inrichting',
    description:
      'Uw fysieke ruimte — lay-out, stellingen, materieel, vloermarkering, verkeersstromen',
  },
  {
    icon: Cog,
    name: 'Werkwijze & Processen',
    description:
      'Uw werkmethoden — orderverwerking, kwaliteitscontroles, standaardisatie',
  },
  {
    icon: Users,
    name: 'Organisatie & Besturing',
    description:
      'Uw aansturing — KPI\u2019s, systemen, rolverdeling, opleidingen, compliance, veiligheidscultuur',
  },
];

export function WelcomeHeader() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'Gebruiker';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welkom {firstName},
        </h1>
        <p className="mt-2 text-base text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Magazijn op Maat</strong> is een
          professionele dienst van{' '}
          <strong className="text-foreground">Logistiekconcurrent</strong>{' '}
          waarin efficiëntie en veiligheid centraal staan. Door middel van een
          onafhankelijke beoordeling door een ervaren logistiek consultant wordt
          u geadviseerd over het verbeteren van de efficiëntie en veiligheid in
          uw magazijn.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          De beoordeling vindt plaats op drie basisaspecten
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {assessmentAspects.map((aspect) => (
            <div
              key={aspect.name}
              className="rounded-lg border bg-muted/30 p-4"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <aspect.icon className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  {aspect.name}
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {aspect.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Elk aspect wordt beoordeeld door zowel een{' '}
        <strong className="text-foreground">efficiëntiebril</strong> (is het
        productief?) als een{' '}
        <strong className="text-foreground">veiligheidsbril</strong> (is het
        veilig en compliant?). In deze portal vindt u alles wat te maken heeft
        met uw QuickScan, en meer.
      </p>
    </div>
  );
}
