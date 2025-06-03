
import type { Metadata } from 'next';
import './globals.css';
// Remove direct import of Toaster
// import { Toaster } from "@/components/ui/toaster"; 
import { Inter as FontSans } from "next/font/google"
import { cn } from "@/lib/utils"
import dynamic from 'next/dynamic'; // Import dynamic

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

// Dynamically import Toaster with ssr: false
const DynamicToaster = dynamic(() => 
  import('@/components/ui/toaster').then(mod => mod.Toaster), 
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Infinity Gaming Lounge POS',
  description: 'Point of Sale system for Infinity Gaming Lounge',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body 
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          fontSans.variable
        )}
      >
        {children} 
        <DynamicToaster /> {/* Use the dynamically imported Toaster */}
      </body>
    </html>
  );
}
