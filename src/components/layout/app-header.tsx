
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
  const [user, setUser] = useState<User | null>(null);
  const [isAdminByEmail, setIsAdminByEmail] = useState(false); // Based on NEXT_PUBLIC_ADMIN_EMAIL
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  // const [userRole, setUserRole] = useState<string | null>(null); // For future database role display

  useEffect(() => {
    const supabase = createClient();
    const fetchUserAndRole = async () => {
      setIsLoadingUser(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Email-based admin check (visual cue)
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        setIsAdminByEmail(!!adminEmail && currentUser.email === adminEmail);

        // Fetch role from 'staff' table - uncomment and adapt if needed for header display
        /*
        const { data: staffMember, error } = await supabase
          .from('staff')
          .select('role')
          .eq('user_id', currentUser.id)
          .single();
        if (staffMember) {
          setUserRole(staffMember.role);
        }
        if(error) console.error("Error fetching role for header:", error);
        */
      } else {
        setIsAdminByEmail(false);
        // setUserRole(null);
      }
      setIsLoadingUser(false);
    };

    fetchUserAndRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        setIsAdminByEmail(!!adminEmail && currentUser.email === adminEmail);
        // Potentially re-fetch role here if it can change during a session
        // fetchUserAndRole(); // Or a more specific role fetch
      } else {
        setIsAdminByEmail(false);
        // setUserRole(null);
      }
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
                {isAdminByEmail ? <ShieldCheck className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-xs">
              <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px]" title={user.email || ''}>
                {user.email || 'User'}
              </span>
              {/* Display role from DB if fetched: {userRole && <span className="text-primary font-semibold">{userRole}</span>} */}
              {isAdminByEmail && <span className="text-primary font-semibold">Admin (Email Match)</span>}
            </div>
          </>
        ) : (
          <UserCircle className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
    </header>
  );
}
