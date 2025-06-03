
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
  Gamepad2, 
  CreditCard,
  Receipt,
  Package,
  Trophy,
  UsersRound,
  Settings,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/sessions', label: 'Game Sessions', icon: Gamepad2 },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/receipts', label: 'Receipt Center', icon: Receipt },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/staff', label: 'Staff', icon: UsersRound },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <Gamepad2 className="h-8 w-8 text-primary" />
          {state === 'expanded' && (
            <h1 className="text-xl font-headline font-semibold text-sidebar-foreground">Infinity Gaming Lounge POS System</h1>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, className: "font-body" }}
                  className="font-body"
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/80 group-hover/menu-button:text-sidebar-accent-foreground"
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
