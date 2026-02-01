'use client';

import { BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BenchmarkNotAvailableProps {
  totalScans?: number;
}

export function BenchmarkNotAvailable({ totalScans }: BenchmarkNotAvailableProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-6 text-xl font-semibold">Benchmark niet beschikbaar</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Er zijn minimaal 15 scans nodig voor een betrouwbare benchmark.
          {totalScans !== undefined && totalScans > 0 && (
            <> Op dit moment zijn er {totalScans} scans voltooid.</>
          )}
          {totalScans === 0 && (
            <> Er zijn nog geen scans voltooid.</>
          )}
        </p>
        {totalScans !== undefined && (
          <div className="mt-6 flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2">
            <span className="text-sm font-medium text-muted-foreground">
              {totalScans} / 15 scans
            </span>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min((totalScans / 15) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
