
"use client";

import type React from 'react';
import { MainLayout } from '@/components/layout/main-layout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // You might want to add a check here for authentication status
  // if middleware isn't sufficient or for client-side rendering scenarios.
  // For now, middleware handles the primary auth guard.
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
