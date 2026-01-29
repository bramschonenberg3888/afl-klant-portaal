import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WelcomeHeader } from '@/components/dashboard/welcome-header';
import { RecentChats } from '@/components/dashboard/recent-chats';
import { ShortcutButtons } from '@/components/dashboard/shortcut-buttons';
import {
  MessageSquare,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <WelcomeHeader />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Veiligheidsassistent</CardTitle>
            </div>
            <CardDescription>
              Stel vragen over magazijnveiligheid en krijg direct antwoord op basis van actuele
              regelgeving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                RI&E en arbobeleid vragen
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Stellingkeuringen en certificering
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Heftruck- en BHV-eisen
              </li>
            </ul>
            <Button asChild>
              <Link href="/chat">
                Start een gesprek
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <CardTitle>Arbobesluit 2026</CardTitle>
            </div>
            <CardDescription>
              Vanaf 2026 wordt er strenger gehandhaafd op magazijnveiligheid. Bereid u voor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Strengere keuringsplicht voor stellingen
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Hogere boetes bij overtredingen
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Uitgebreidere documentatie-eisen
              </li>
            </ul>
            <Button variant="outline" asChild>
              <Link href="/chat?topic=arbobesluit">
                Meer informatie
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentChats />
        <ShortcutButtons />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Kennisbank</CardTitle>
          </div>
          <CardDescription>Onze AI-assistent is getraind op de volgende bronnen:</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-3">
              <h4 className="font-medium text-sm">Arbobesluit</h4>
              <p className="text-xs text-muted-foreground">Officiële wetgeving</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="font-medium text-sm">NEN-normen</h4>
              <p className="text-xs text-muted-foreground">Stellingkeuringen</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="font-medium text-sm">Inspectie SZW</h4>
              <p className="text-xs text-muted-foreground">Handhavingsrichtlijnen</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="font-medium text-sm">RI&E Richtlijnen</h4>
              <p className="text-xs text-muted-foreground">Risico-inventarisatie</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="font-medium text-sm">BHV Eisen</h4>
              <p className="text-xs text-muted-foreground">Bedrijfshulpverlening</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="font-medium text-sm">Heftruck Certificering</h4>
              <p className="text-xs text-muted-foreground">Opleidingseisen</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
