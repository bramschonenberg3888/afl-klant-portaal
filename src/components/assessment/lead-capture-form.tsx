'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock } from 'lucide-react';

interface LeadCaptureFormProps {
  responseId: string;
  onComplete: () => void;
}

export function LeadCaptureForm({ responseId, onComplete }: LeadCaptureFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const complete = trpc.assessment.completeAssessment.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await complete.mutateAsync({
        responseId,
        contactName: name || undefined,
        contactEmail: email || undefined,
        contactCompany: company || undefined,
        contactPhone: phone || undefined,
      });
      onComplete();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Bijna klaar!</CardTitle>
          <CardDescription>
            Vul uw gegevens in om uw resultaten te bekijken. Wij nemen vrijblijvend contact met u op
            om uw resultaten te bespreken.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lead-name">Naam *</Label>
              <Input
                id="lead-name"
                placeholder="Uw volledige naam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-email">E-mailadres *</Label>
              <Input
                id="lead-email"
                type="email"
                placeholder="uw@email.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-company">Bedrijfsnaam</Label>
              <Input
                id="lead-company"
                placeholder="Uw bedrijfsnaam"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-phone">Telefoonnummer</Label>
              <Input
                id="lead-phone"
                type="tel"
                placeholder="06-12345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !name || !email}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig met verwerken...
                </>
              ) : (
                'Bekijk mijn resultaten'
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Uw gegevens worden vertrouwelijk behandeld conform ons privacybeleid.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
