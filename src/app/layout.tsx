
import type { Metadata } from 'next';
import './globals.css';
import { Inter as FontSans, Roboto, Montserrat, Source_Code_Pro } from "next/font/google"
import { cn } from "@/lib/utils"
import ClientToaster from '@/components/client-toaster';
import { ThemeProvider } from '@/components/theme-provider';
import ReactQueryProvider from '@/components/react-query-provider';

export const dynamic = 'force-dynamic';

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-headline",
})

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-code",
})

export const metadata: Metadata = {
  title: 'Infinity Gaming Lounge',
  description: 'Point of Sale system for Infinity Gaming Lounge',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          fontSans.variable,
          roboto.variable,
          montserrat.variable,
          sourceCodePro.variable
        )}
      >
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <ClientToaster />
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
