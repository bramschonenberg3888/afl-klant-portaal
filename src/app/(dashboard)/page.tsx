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
      'Uitgebreide veiligheidsscan van uw magazijn met bevindingen, prioriteiten en een routekaart voor verbetering.',
    href: '/quick-scan',
    cta: 'Naar QuickScan',
  },
  {
    icon: FileText,
    title: 'Documenten',
    description:
      'Beheer uw veiligheidsdocumenten, certificaten en compliance-documenten op één centrale plek.',
    href: '/documents',
    cta: 'Naar documenten',
  },
  {
    icon: ClipboardList,
    title: 'Evaluaties',
    description:
      'Vul tussentijdse evaluaties in die door uw consultant zijn klaargezet en volg uw voortgang.',
    href: '/self-assessment',
    cta: 'Naar evaluaties',
  },
  {
    icon: Package,
    title: 'Producten',
    description:
      'Ontdek veiligheidsproducten en ontvang aanbevelingen op basis van uw QuickScan resultaten.',
    href: '/products',
    cta: 'Naar producten',
  },
  {
    icon: BarChart3,
    title: 'Benchmark',
    description:
      'Vergelijk uw veiligheidsprestaties met andere organisaties en ontdek verbeterkansen.',
    href: '/benchmark',
    cta: 'Naar benchmark',
  },
  {
    icon: MessageSquare,
    title: 'Veiligheidsassistent',
    description:
      'Stel vragen over magazijnveiligheid en krijg direct antwoord op basis van actuele regelgeving.',
    href: '/chat',
    cta: 'Start een gesprek',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <WelcomeHeader />

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
