
import type { Metadata } from 'next';
import './globals.css';
import { MainLayout } from '@/components/layout/main-layout';
import { Toaster } from "@/components/ui/toaster";
import { Inter as FontSans } from "next/font/google"
import { cn } from "@/lib/utils"
 
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

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
        {/* Conditionally render MainLayout or a simpler layout for auth pages */}
        {/* This logic would ideally be handled by route groups in Next.js App Router */}
        {/* For now, this is a conceptual placeholder. Proper layout switching needs route groups or similar. */}
        {/* <MainLayout>{children}</MainLayout> */}
        {children} 
        <Toaster />
      </body>
    </html>
  );
}
