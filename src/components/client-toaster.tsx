
"use client";

import dynamic from 'next/dynamic';
import type React from 'react';

// Dynamically import Toaster with ssr: false
const DynamicToaster = dynamic(() =>
  import('@/components/ui/toaster').then(mod => mod.Toaster),
  { 
    ssr: false,
    loading: () => null, // Optional: provide a loading component or null
  }
);

export default function ClientToaster(): React.JSX.Element {
  return <DynamicToaster />;
}
