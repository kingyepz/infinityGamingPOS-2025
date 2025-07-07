
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

const getPageTitle = (pathname: string): string => {
  if (pathname === '/dashboard') return 'Dashboard Overview';
  if (pathname === '/dashboard/admin') return 'Admin Dashboard';
  if (pathname === '/dashboard/cashier') return 'Cashier Dashboard';
  if (pathname.startsWith('/customers')) return 'Customer Management';
  if (pathname.startsWith('/sessions')) return 'Game Session Management';
  if (pathname.startsWith('/support')) return 'Customer Support Tickets';
  return 'Infinity Gaming Lounge POS'; // Default or for /
};


export function AppHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [userRoleForDisplay, setUserRoleForDisplay] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const supabase = createClient();
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
          console.warn(`AppHeader: Error fetching user details from public.users for ${currentAuthUser.id}:`, userDbError.message);
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
      // Re-fetch profile on auth change
      fetchUserAndProfile();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h2 className="text-lg font-headline font-semibold text-foreground">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        {isLoadingUser ? (
          <>
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : authUser ? (
          <>
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/100x100.png" alt={userFullName || "User Avatar"} data-ai-hint="user avatar" />
              <AvatarFallback>
                {userRoleForDisplay === 'admin' ? <ShieldCheck className="h-5 w-5" /> : (getInitials(userFullName) || <UserCircle className="h-5 w-5" />)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-xs">
              <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px]" title={userFullName || authUser.email || ''}>
                {userFullName || authUser.email || 'User'}
              </span>
              {userRoleForDisplay && (
                <span className="text-primary font-semibold capitalize">
                  {userRoleForDisplay}
                </span>
              )}
            </div>
          </>
        ) : (
          <UserCircle className="h-6 w-6 text-muted-foreground" />
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
