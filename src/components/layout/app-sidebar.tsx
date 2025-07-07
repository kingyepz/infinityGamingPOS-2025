
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
  Tv,
  Play,
  Album,
  CreditCard,
  Warehouse,
  Swords,
  Settings,
  CircleUser,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';


const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'cashier', 'supervisor'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'cashier', 'supervisor'] },
  { href: '/sessions', label: 'Game Sessions', icon: Play, roles: ['admin', 'cashier', 'supervisor'] },
  { href: '/stations', label: 'Stations', icon: GamepadIcon, roles: ['admin', 'supervisor'] },
  { href: '/games', label: 'Games', icon: Album, roles: ['admin', 'supervisor'] },
  { href: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'cashier', 'supervisor'] },
  { href: '/inventory', label: 'Inventory', icon: Warehouse, roles: ['admin', 'supervisor'], comingSoon: true },
  { href: '/tournaments', label: 'Tournaments', icon: Swords, roles: ['admin', 'supervisor'], comingSoon: true },
  { href: '/support', label: 'AI Support', icon: BrainCircuit, roles: ['admin', 'cashier', 'supervisor'] },
  { href: '/users', label: 'User Management', icon: CircleUser, roles: ['admin'], comingSoon: true },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin'], comingSoon: true },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchUserRole = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (data) {
          setUserRole(data.role);
        } else {
            console.warn("Sidebar: Could not fetch user role.", error?.message)
            setUserRole(null); // No specific role found
        }
      }
      setIsLoading(false);
    };

    fetchUserRole();
     const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
        fetchUserRole();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const filteredNavItems = React.useMemo(() => {
    if (isLoading || !userRole) {
      return []; // Or a skeleton state
    }
    return navItems.filter(item => item.roles.includes(userRole));
  }, [userRole, isLoading]);

  return (
    <>
      <SidebarHeader className="p-4 border-b border-border/60">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg shadow-md">
            <GamepadIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <span
            className={cn(
              "text-lg font-bold font-headline text-sidebar-foreground tracking-tight",
              state === 'collapsed' && "hidden"
            )}
          >
            Infinity Gaming Lounge
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {isLoading && Array.from({ length: 5 }).map((_, index) => (
             <SidebarMenuItem key={index} className="px-2">
                <div className="h-10 w-full bg-muted/50 animate-pulse rounded-md" />
             </SidebarMenuItem>
          ))}
          {!isLoading && filteredNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.comingSoon ? "#" : item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={{ children: item.label, className: "font-body" }}
                    className="font-body text-base font-medium"
                    size="lg"
                    disabled={item.comingSoon}
                    aria-disabled={item.comingSoon}
                  >
                    <item.icon className={cn(
                      "h-5 w-5",
                      isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                     )} />
                    <span>{item.label}</span>
                     {item.comingSoon && state === 'expanded' && (
                        <Badge variant="outline" className="ml-auto text-xs bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border-none">Soon</Badge>
                    )}
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
