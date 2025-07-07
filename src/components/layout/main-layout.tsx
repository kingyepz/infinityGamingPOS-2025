
"use client";

import type React from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen bg-background">
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r border-border/60">
          <AppSidebar />
        </Sidebar>
        <SidebarRail />
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
            {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
