
"use client";

import React, { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/customers')) return 'Customer Management';
  if (pathname.startsWith('/sessions')) return 'Game Session Management';
  if (pathname.startsWith('/support')) return 'AI Support Center';
  if (pathname.startsWith('/payments')) return 'Payments & Transactions';
  if (pathname.startsWith('/inventory')) return 'Inventory Management';
  if (pathname.startsWith('/tournaments')) return 'Tournament Hub';
  if (pathname.startsWith('/users')) return 'User Management';
  if (pathname.startsWith('/settings')) return 'System Settings';
  return 'Infinity Gaming Lounge';
};


export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [userRoleForDisplay, setUserRoleForDisplay] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setIsLoadingUser(true);
      const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
      setAuthUser(currentAuthUser);

      if (currentAuthUser) {
        // Fetch full_name and role from public.users table
        const { data: userData, error: userDbError } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('id', currentAuthUser.id)
          .single();

        if (userDbError) {
          console.warn(`AppHeader: Error fetching user details for ${currentAuthUser.id}:`, userDbError.message);
          setUserFullName(currentAuthUser.email); // Fallback to email
          setUserRoleForDisplay(null);
        } else if (userData) {
          setUserFullName(userData.full_name || currentAuthUser.email); // Use full_name or fallback to email
          setUserRoleForDisplay(userData.role);
        } else {
            setUserFullName(currentAuthUser.email); // Fallback to email if no record found
            setUserRoleForDisplay(null);
            console.warn(`AppHeader: No user record found in public.users for ${currentAuthUser.id}`);
        }
      } else {
        setUserFullName(null);
        setUserRoleForDisplay(null);
      }
      setIsLoadingUser(false);
    };

    fetchUserAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      fetchUserAndProfile();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h2 className="text-lg font-headline font-semibold text-foreground">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
         {isLoadingUser ? (
          <Skeleton className="h-9 w-9 rounded-full" />
        ) : authUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="https://placehold.co/100x100.png" alt={userFullName || "User Avatar"} data-ai-hint="user avatar" />
                      <AvatarFallback>
                        {userRoleForDisplay === 'admin' ? <ShieldCheck className="h-5 w-5" /> : (getInitials(userFullName) || <UserCircle className="h-5 w-5" />)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate" title={userFullName || authUser.email || ''}>
                      {userFullName || authUser.email || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {userRoleForDisplay}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        ) : (
          <UserCircle className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
    </header>
  );
}
