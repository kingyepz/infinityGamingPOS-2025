
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
  BrainCircuit, // For Support Tickets
  ShieldAlert, // For Admin Dashboard
  DollarSign // For Cashier Dashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define a type for nav items if you want more structure, e.g., for role-based visibility later
// interface NavItem {
//   href: string;
//   label: string;
//   icon: React.ElementType;
//   roles?: string[]; // Optional: for future role-based rendering
// }

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin', label: 'Admin Panel', icon: ShieldAlert, roles: ['admin'] }, // Example role
  { href: '/dashboard/cashier', label: 'Cashier Panel', icon: DollarSign, roles: ['admin', 'cashier'] }, // Example roles
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/sessions', label: 'Game Sessions', icon: GamepadIcon },
  { href: '/support', label: 'Support Tickets', icon: BrainCircuit },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  // In a real app, you'd fetch user role here, perhaps from a context
  // const userRole = useUserRole(); // Fictional hook for user role

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <GamepadIcon className="h-8 w-8 text-primary" />
          {state === 'expanded' && (
            <h1 className="text-xl font-headline font-semibold text-primary">Infinity Gaming Lounge POS</h1>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            // Basic role check example - this would be more robust with a context/state
            // if (item.roles && !item.roles.includes(userRole)) {
            //   return null; 
            // }
            const isActive = pathname === item.href || 
                             (item.href !== '/dashboard' && pathname.startsWith(item.href)) ||
                             (item.href === '/dashboard' && (pathname === '/dashboard/admin' || pathname === '/dashboard/cashier') && pathname !== '/dashboard') === false;


            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={{ children: item.label, className: "font-body" }}
                    className="font-body"
                  >
                    <item.icon className={cn(
                      "h-5 w-5",
                      isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/80 group-hover/menu-button:text-sidebar-accent-foreground"
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
