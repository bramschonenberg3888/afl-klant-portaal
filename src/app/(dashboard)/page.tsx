import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WelcomeHeader } from '@/components/dashboard/welcome-header';
import {
  ClipboardCheck,
  FileText,
  ClipboardList,
  Package,
  BarChart3,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: ClipboardCheck,
    title: 'QuickScan',
    description:
      'Het hart van de portal. Hier vindt u de volledige resultaten van uw magazijnbeoordeling: de 3x2 scorematrix, bevindingen met foto\u2019s, een prioriteitenmatrix, een verbeterroutekaart en een actieoverzicht om verbeteringen bij te houden.',
    href: '/quick-scan',
    cta: 'Naar QuickScan',
  },
  {
    icon: FileText,
    title: 'Documenten',
    description:
      'Uw centrale plek voor alle relevante documenten: van het QuickScan-rapport en compliance-documenten tot werkinstructies en certificaten. Met meldingen wanneer documenten verlopen.',
    href: '/documents',
    cta: 'Naar documenten',
  },
  {
    icon: ClipboardList,
    title: 'Evaluaties',
    description:
      'Tussentijdse voortgangsevaluaties die door uw consultant worden klaargezet. Hiermee meet u hoe uw magazijn zich ontwikkelt sinds de laatste scan.',
    href: '/self-assessment',
    cta: 'Naar evaluaties',
  },
  {
    icon: Package,
    title: 'Producten',
    description:
      'Een overzicht van veiligheids- en magazijnproducten die aansluiten bij de bevindingen uit uw QuickScan. Denk aan aanrijdbeveiliging, vloermarkering, stellingen en meer. Direct een offerte aanvragen kan hier.',
    href: '/products',
    cta: 'Naar producten',
  },
  {
    icon: BarChart3,
    title: 'Benchmark',
    description:
      'Vergelijk uw scores met die van andere organisaties. Zo ziet u waar u staat ten opzichte van vergelijkbare magazijnen en waar de grootste verbeterkansen liggen.',
    href: '/benchmark',
    cta: 'Naar benchmark',
  },
  {
    icon: MessageSquare,
    title: 'Veiligheidsassistent',
    description:
      'Een AI-gestuurde chatbot die uw vragen over magazijnveiligheid beantwoordt. Op basis van actuele regelgeving en best practices krijgt u direct antwoord op uw vragen.',
    href: '/chat',
    cta: 'Start een gesprek',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <WelcomeHeader />

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Wat vindt u in deze portal?
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <feature.icon className="h-5 w-5 text-primary" />
                <CardTitle>{feature.title}</CardTitle>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button variant="outline" className="w-full" asChild>
                <Link href={feature.href}>
                  {feature.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
