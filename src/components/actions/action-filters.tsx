'use client';

import { X } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ActionStatus, ActionPriority, Layer, Perspective } from '@/generated/prisma/client';

export interface ActionFilters {
  status?: ActionStatus;
  priority?: ActionPriority;
  layer?: Layer;
  perspective?: Perspective;
  assigneeId?: string;
}

interface ActionFiltersProps {
  filters: ActionFilters;
  onChange: (_filters: ActionFilters) => void;
}

export function ActionFiltersToolbar({ filters, onChange }: ActionFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(Boolean);

  function updateFilter<K extends keyof ActionFilters>(key: K, value: ActionFilters[K] | '') {
    onChange({
      ...filters,
      [key]: value || undefined,
    });
  }

  function clearFilters() {
    onChange({});
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={filters.status ?? ''}
          onChange={(e) => updateFilter('status', e.target.value as ActionStatus | '')}
          className="w-[150px]"
        >
          <option value="">Alle statussen</option>
          <option value="TODO">Te doen</option>
          <option value="IN_PROGRESS">In uitvoering</option>
          <option value="DONE">Afgerond</option>
          <option value="DEFERRED">Uitgesteld</option>
          <option value="CANCELLED">Geannuleerd</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Prioriteit</Label>
        <Select
          value={filters.priority ?? ''}
          onChange={(e) => updateFilter('priority', e.target.value as ActionPriority | '')}
          className="w-[140px]"
        >
          <option value="">Alle prioriteiten</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">Hoog</option>
          <option value="MEDIUM">Gemiddeld</option>
          <option value="LOW">Laag</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Laag</Label>
        <Select
          value={filters.layer ?? ''}
          onChange={(e) => updateFilter('layer', e.target.value as Layer | '')}
          className="w-[180px]"
        >
          <option value="">Alle lagen</option>
          <option value="RUIMTE_INRICHTING">Ruimte &amp; Inrichting</option>
          <option value="WERKWIJZE_PROCESSEN">Werkwijze &amp; Processen</option>
          <option value="ORGANISATIE_BESTURING">Organisatie &amp; Besturing</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Perspectief</Label>
        <Select
          value={filters.perspective ?? ''}
          onChange={(e) => updateFilter('perspective', e.target.value as Perspective | '')}
          className="w-[140px]"
        >
          <option value="">Alle perspectieven</option>
          <option value="EFFICIENT">Effici&euml;nt</option>
          <option value="VEILIG">Veilig</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Toegewezen aan (ID)</Label>
        <Input
          value={filters.assigneeId ?? ''}
          onChange={(e) => updateFilter('assigneeId', e.target.value || undefined)}
          placeholder="Zoek op gebruiker ID..."
          className="w-[180px]"
        />
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="size-3" />
          Wis filters
        </Button>
      )}
    </div>
  );
}
