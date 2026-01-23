import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ClipboardCheck, ArrowRight, Clock } from 'lucide-react';

export function ComingSoonCard() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ClipboardCheck className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <CardTitle className="text-2xl">Quick-Scan</CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Binnenkort
          </Badge>
        </div>
        <CardDescription className="text-base">
          Een snelle zelfevaluatie voor uw magazijnveiligheid
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium">Wat kunt u verwachten?</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                1
              </div>
              <span>
                <strong className="text-foreground">Snelle vragenlijst</strong> - Beantwoord in 5
                minuten vragen over uw huidige veiligheidssituatie
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                2
              </div>
              <span>
                <strong className="text-foreground">Direct inzicht</strong> - Ontvang een score en
                zie waar uw sterke punten en aandachtspunten liggen
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                3
              </div>
              <span>
                <strong className="text-foreground">Concrete aanbevelingen</strong> - Krijg
                praktische tips om uw veiligheid te verbeteren
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            In de tussentijd kunt u uw vragen stellen aan onze Veiligheidsassistent
          </p>
          <Button asChild>
            <Link href="/chat">
              Naar de Veiligheidsassistent
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
