'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { NavMain } from './nav-main';
import { NavAdmin } from './nav-admin';
import { NavUser } from './nav-user';

export function AppSidebar() {
  return (
    <Sidebar collapsible="none" className="h-svh">
      <SidebarHeader className="p-5">
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-tight">Veiligheidsportaal</span>
          <span className="text-sm opacity-70">Magazijn Compliance</span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <NavMain />
        <SidebarSeparator />
        <NavAdmin />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
