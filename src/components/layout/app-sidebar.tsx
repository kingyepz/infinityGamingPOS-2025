
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Users, 
  Gamepad2 as GamepadIcon, // Renamed to avoid conflict if Gamepad2 is used elsewhere
  CreditCard,
  Receipt,
  Package,
  Trophy,
  UsersRound,
  Settings,
  BarChart3,
  BrainCircuit // Added for Support Tickets
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/sessions', label: 'Game Sessions', icon: GamepadIcon },
  // { href: '/payments', label: 'Payments', icon: CreditCard }, // Example, if you add this page
  // { href: '/receipts', label: 'Receipt Center', icon: Receipt }, // Example
  { href: '/support', label: 'Support Tickets', icon: BrainCircuit }, // Added Support page
  // { href: '/inventory', label: 'Inventory', icon: Package }, // Example
  // { href: '/tournaments', label: 'Tournaments', icon: Trophy }, // Example
  // { href: '/staff', label: 'Staff', icon: UsersRound }, // Example
  // { href: '/reports', label: 'Reports', icon: BarChart3 }, // Example
  // { href: '/settings', label: 'Settings', icon: Settings }, // Example
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <GamepadIcon className="h-8 w-8 text-primary" />
          {state === 'expanded' && (
            <h1 className="text-xl font-headline font-semibold text-sidebar-foreground">Infinity Gaming Lounge POS</h1>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, className: "font-body" }}
                  className="font-body"
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/80 group-hover/menu-button:text-sidebar-accent-foreground"
                   )} />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
