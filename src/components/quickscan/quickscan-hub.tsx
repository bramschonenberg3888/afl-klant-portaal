'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Search,
  Grid3X3,
  Map,
  ListTodo,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TabDashboard } from './tab-dashboard';
import { TabManagementSummary } from './tab-management-summary';
import { TabBevindingen } from './tab-bevindingen';
import { TabPrioriteiten } from './tab-prioriteiten';
import { TabRoutekaart } from './tab-routekaart';
import { TabActies } from './tab-acties';
import type { RAGScore, Layer, Perspective, ImpactLevel, Timeframe, RoadmapStatus } from '@/generated/prisma/client';

export interface QuickScanData {
  id: string;
  title: string;
  overallEfficiency: RAGScore | null;
  overallSafety: RAGScore | null;
  summary: string | null;
  managementSummary: string | null;
  consultant: { name: string | null } | null;
  cells: Array<{
    id: string;
    layer: Layer;
    perspective: Perspective;
    score: RAGScore | null;
    summary: string | null;
    findings: Array<{
      id: string;
      title: string;
    }>;
  }>;
  findings: Array<{
    id: string;
    title: string;
    description: string | null;
    efficiencyImpact: ImpactLevel;
    safetyImpact: ImpactLevel;
    recommendation: string | null;
    photoUrls: string[];
    impactScore: number | null;
    effortScore: number | null;
    cell: { layer: Layer; perspective: Perspective } | null;
  }>;
  roadmapItems: Array<{
    id: string;
    title: string;
    description: string | null;
    timeframe: Timeframe;
    status: RoadmapStatus;
    priority: number;
    dueDate: Date | string | null;
    owner: { name: string | null } | null;
  }>;
}

const tabs = [
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'samenvatting', label: 'Samenvatting', icon: FileText },
  { value: 'bevindingen', label: 'Bevindingen', icon: Search },
  { value: 'prioriteiten', label: 'Prioriteiten', icon: Grid3X3 },
  { value: 'routekaart', label: 'Routekaart', icon: Map },
  { value: 'acties', label: 'Acties', icon: ListTodo },
] as const;

type TabValue = (typeof tabs)[number]['value'];

interface QuickScanHubProps {
  scan: QuickScanData;
  initialTab?: string;
}

export function QuickScanHub({ scan, initialTab }: QuickScanHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get('tab') ?? initialTab ?? 'dashboard') as TabValue;

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'dashboard') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    const qs = params.toString();
    router.replace(`/quick-scan${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{scan.title}</h1>

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList variant="line" className="w-full justify-start">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="dashboard">
          <TabDashboard scan={scan} />
        </TabsContent>
        <TabsContent value="samenvatting">
          <TabManagementSummary scan={scan} />
        </TabsContent>
        <TabsContent value="bevindingen">
          <TabBevindingen scan={scan} />
        </TabsContent>
        <TabsContent value="prioriteiten">
          <TabPrioriteiten scan={scan} />
        </TabsContent>
        <TabsContent value="routekaart">
          <TabRoutekaart scan={scan} />
        </TabsContent>
        <TabsContent value="acties">
          <TabActies />
        </TabsContent>
      </Tabs>
    </div>
  );
}
