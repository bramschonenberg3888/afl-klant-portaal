'use client';

import { useState, type ReactNode } from 'react';
import { Send } from 'lucide-react';
import { trpc } from '@/trpc/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface QuoteRequestDialogProps {
  productId?: string;
  organizationId?: string;
  productName?: string;
  trigger: ReactNode;
  open?: boolean;
  onOpenChange?: (_open: boolean) => void;
}

export function QuoteRequestDialog({
  productId,
  organizationId,
  productName,
  trigger,
  open,
  onOpenChange,
}: QuoteRequestDialogProps) {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const requestQuote = trpc.products.requestQuote.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestQuote.mutate({
      productId: productId || undefined,
      organizationId: organizationId || undefined,
      contactName,
      contactEmail,
      contactPhone: contactPhone || undefined,
      message: message || undefined,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange?.(isOpen);
    if (!isOpen) {
      // Reset form on close
      setTimeout(() => {
        setContactName('');
        setContactEmail('');
        setContactPhone('');
        setMessage('');
        setSubmitted(false);
        requestQuote.reset();
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Send className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <DialogHeader>
              <DialogTitle>Offerte aangevraagd</DialogTitle>
              <DialogDescription>
                Uw aanvraag is verzonden. Wij nemen zo snel mogelijk contact met u op.
              </DialogDescription>
            </DialogHeader>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Sluiten
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Offerte Aanvragen</DialogTitle>
              <DialogDescription>
                {productName
                  ? `Vraag een offerte aan voor ${productName}.`
                  : 'Vul uw gegevens in om een offerte aan te vragen.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {productName && (
                <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
                  {productName}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="quote-name">Naam *</Label>
                <Input
                  id="quote-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Uw volledige naam"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-email">E-mailadres *</Label>
                <Input
                  id="quote-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="uw@email.nl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-phone">Telefoonnummer</Label>
                <Input
                  id="quote-phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+31 6 12345678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-message">Bericht</Label>
                <Textarea
                  id="quote-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Beschrijf uw situatie of stel uw vragen..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={requestQuote.isPending}>
                  {requestQuote.isPending ? 'Verzenden...' : 'Verstuur Aanvraag'}
                  {!requestQuote.isPending && <Send className="ml-2 h-4 w-4" />}
                </Button>
              </DialogFooter>

              {requestQuote.isError && (
                <p className="text-sm text-destructive text-center">
                  Er is een fout opgetreden. Probeer het opnieuw.
                </p>
              )}
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
