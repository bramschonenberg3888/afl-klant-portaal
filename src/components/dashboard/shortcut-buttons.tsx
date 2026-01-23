'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, AlertTriangle, FileText, HardHat } from 'lucide-react';

const shortcuts = [
  {
    label: 'RI&E Vragen',
    description: 'Risico-inventarisatie en -evaluatie',
    icon: ShieldCheck,
    href: '/chat?topic=rie',
  },
  {
    label: 'Arbobesluit 2026',
    description: 'Nieuwe regelgeving en handhaving',
    icon: AlertTriangle,
    href: '/chat?topic=arbobesluit',
  },
  {
    label: 'Magazijnveiligheid',
    description: 'Stellingen, heftrucks en vluchtwegen',
    icon: HardHat,
    href: '/chat?topic=magazijn',
  },
  {
    label: 'Documentatie',
    description: 'Vereiste documentatie en checklists',
    icon: FileText,
    href: '/chat?topic=documentatie',
  },
];

export function ShortcutButtons() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Snelkoppelingen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {shortcuts.map((shortcut) => (
            <Button
              key={shortcut.label}
              variant="outline"
              className="h-auto flex-col items-start gap-1 p-4 text-left"
              asChild
            >
              <Link href={shortcut.href}>
                <div className="flex items-center gap-2 w-full">
                  <shortcut.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{shortcut.label}</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal">
                  {shortcut.description}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
