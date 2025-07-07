
"use client";

import type React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { AppHeader } from '@/components/layout/app-header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // You might want to add a check here for authentication status
  // if middleware isn't sufficient or for client-side rendering scenarios.
  // For now, middleware handles the primary auth guard.
  return (
    <MainLayout>
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        {children}
      </main>
    </MainLayout>
  );
}
