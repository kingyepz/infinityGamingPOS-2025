
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, UserPlus } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
        <Link href="/sessions" passHref className="w-full sm:w-auto">
          <Button className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" /> Start New Session
          </Button>
        </Link>
        <Link href="/customers" passHref className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full">
            <UserPlus className="mr-2 h-4 w-4" /> Register New Customer
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
