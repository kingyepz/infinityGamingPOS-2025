
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
  Gamepad2 as GamepadIcon,
  BrainCircuit,
  ShieldAlert,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin', label: 'Admin Panel', icon: ShieldAlert, roles: ['admin'] },
  { href: '/dashboard/cashier', label: 'Cashier Panel', icon: DollarSign, roles: ['admin', 'cashier'] },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/sessions', label: 'Game Sessions', icon: GamepadIcon },
  { href: '/support', label: 'Support Tickets', icon: BrainCircuit },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <>
      <SidebarHeader className="p-4 border-b border-border/60">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <GamepadIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <span
            className={cn(
              "text-lg font-bold text-foreground",
              state === 'collapsed' && "hidden"
            )}
          >
            Infinity POS
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
                             (item.href !== '/dashboard' && pathname.startsWith(item.href)) ||
                             (item.href === '/dashboard' && (pathname === '/dashboard/admin' || pathname === '/dashboard/cashier') && pathname !== '/dashboard') === false;

            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={{ children: item.label, className: "font-body" }}
                    className="font-body text-base"
                    size="lg"
                  >
                    <item.icon className={cn(
                      "h-5 w-5",
                      isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                     )} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
