'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Home,
  MessageSquare,
  ClipboardCheck,
  FileText,
  Package,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  User,
  Menu,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { trpc } from '@/trpc/client';

const allNavItems = [
  { label: 'Home', href: '/', icon: Home, roles: null },
  { label: 'QuickScan', href: '/quick-scan', icon: ClipboardCheck, roles: null },
  { label: 'Veiligheidsassistent', href: '/chat', icon: MessageSquare, roles: null },
  { label: 'Benchmark', href: '/benchmark', icon: BarChart3, roles: null },
  { label: 'Producten', href: '/products', icon: Package, roles: null },
  { label: 'Documenten', href: '/documents', icon: FileText, roles: null },
  { label: 'Instellingen', href: '/settings', icon: Settings, roles: null },
  {
    label: 'Beheer',
    href: '/admin',
    icon: Shield,
    roles: ['ADMIN', 'CONSULTANT'] as string[],
  },
];

function useUserInitials() {
  const { data: session } = useSession();
  const user = session?.user;
  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  return { user, initials };
}

function OrgSwitcher() {
  const { data: session, update } = useSession();
  const { data: orgs } = trpc.organizations.list.useQuery(undefined, {
    enabled: !!session?.user,
  });
  const switchOrg = trpc.organizations.switchOrg.useMutation({
    onSuccess: () => {
      update();
      window.location.reload();
    },
  });

  if (!orgs || orgs.length <= 1) return null;

  const currentOrg = orgs.find((o) => o.id === session?.user?.organizationId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="hidden h-8 gap-1 px-2 text-sm text-white/80 hover:bg-white/10 hover:text-white md:flex"
        >
          {currentOrg?.name ?? 'Organisatie'}
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Organisatie wisselen</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => switchOrg.mutate({ organizationId: org.id })}
            className="flex items-center justify-between"
          >
            {org.name}
            {org.id === session?.user?.organizationId && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardHeader() {
  const pathname = usePathname();
  const { user, initials } = useUserInitials();

  const globalRole = user?.globalRole;
  const orgRole = user?.orgRole;
  const effectiveRole = orgRole ?? globalRole;

  const navItems = allNavItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(effectiveRole ?? '') || item.roles.includes(globalRole ?? '');
  });

  return (
    <header className="flex h-24 shrink-0 items-center bg-[#0052CC] px-4 md:px-12">
      {/* Logo */}
      <Link href="/" className="mr-8 shrink-0">
        <Image
          src="/logo-lc.svg"
          alt="Logistiekconcurrent"
          width={189}
          height={64}
          className="hidden h-16 w-auto md:block"
          priority
        />
        <Image
          src="/logo-lc.svg"
          alt="Logistiekconcurrent"
          width={120}
          height={40}
          className="block h-10 w-auto md:hidden"
          priority
        />
      </Link>

      {/* Org switcher */}
      <OrgSwitcher />

      {/* Desktop nav */}
      <nav className="hidden items-center gap-1 md:flex">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white',
                isActive && 'bg-white/15 text-white'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-5">
        {/* Branding text - desktop only */}
        <div className="hidden text-right text-white lg:block">
          <p className="text-base font-bold leading-tight">Magazijn op Maat</p>
          <p className="text-sm leading-tight opacity-80">Klantportaal</p>
        </div>

        {/* User dropdown - desktop */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="hidden h-10 w-10 rounded-full p-0 hover:bg-white/10 md:flex"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-white/20 text-sm text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'Gebruiker'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="mr-2 h-4 w-4" />
                Profiel
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="mr-2 h-4 w-4" />
              Uitloggen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menu openen</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-[#0052CC] p-0 text-white">
            <SheetHeader className="border-b border-white/10 p-6">
              <SheetTitle className="text-left text-white">
                <Image
                  src="/logo-lc.svg"
                  alt="Logistiekconcurrent"
                  width={140}
                  height={47}
                  className="h-10 w-auto"
                />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-4">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white',
                      isActive && 'bg-white/15 text-white'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-white/10 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-white/20 text-sm text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user?.name || 'Gebruiker'}</p>
                  <p className="truncate text-xs text-white/60">{user?.email || ''}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Uitloggen
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
