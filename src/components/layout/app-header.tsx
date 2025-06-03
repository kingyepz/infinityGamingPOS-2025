
"use client";

import React, { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';

const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return 'Dashboard Overview';
  if (pathname.startsWith('/customers')) return 'Customer Management';
  if (pathname.startsWith('/sessions')) return 'Game Session Management';
  if (pathname.startsWith('/payments')) return 'Payment Management';
  if (pathname.startsWith('/receipts')) return 'Receipt Center';
  if (pathname.startsWith('/inventory')) return 'Inventory Management';
  if (pathname.startsWith('/tournaments')) return 'Tournament Management';
  if (pathname.startsWith('/staff')) return 'Staff Management';
  if (pathname.startsWith('/reports')) return 'Reports & Analytics';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/support')) return 'Customer Support Tickets';
  return 'Infinity Gaming Lounge POS';
};


export function AppHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      setIsLoadingUser(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        if (adminEmail && currentUser.email === adminEmail) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setIsLoadingUser(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && session.user.email) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        if (adminEmail && session.user.email === adminEmail) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      // No need to set isLoadingUser here as it's mainly for initial load
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h2 className="text-lg font-headline font-semibold text-foreground">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        {isLoadingUser ? (
          <>
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : user ? (
          <>
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/100x100.png" alt={user.email || "User Avatar"} data-ai-hint="user avatar" />
              <AvatarFallback>
                {isAdmin ? <ShieldCheck className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-xs">
              <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px]" title={user.email || ''}>
                {user.email || 'User'}
              </span>
              {isAdmin && <span className="text-primary font-semibold">Admin</span>}
            </div>
          </>
        ) : (
          <UserCircle className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
    </header>
  );
}
