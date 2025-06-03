
"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return 'Dashboard Overview';
  if (pathname.startsWith('/customers')) return 'Customer Management';
  if (pathname.startsWith('/sessions')) return 'Game Session Manager';
  if (pathname.startsWith('/support')) return 'Customer Support Tickets';
  return 'Infinity Gaming Lounge POS';
};


export function AppHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h2 className="text-lg font-headline font-semibold text-foreground">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        {/* Placeholder for user actions/profile */}
        <Avatar className="h-9 w-9">
          <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
          <AvatarFallback>
            <UserCircle className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
