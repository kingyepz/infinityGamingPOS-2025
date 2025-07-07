
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Customer } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { Star, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TierDistributionChart from './components/tier-distribution-chart';
import LoyaltyCustomersTable from './components/loyalty-customers-table';

const fetchCustomers = async (): Promise<Customer[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('loyalty_points', { ascending: false }); // Order by points for leaderboard
  if (error) throw new Error(error.message);
  return data;
};

export default function LoyaltyPage() {
  const { data: customers, isLoading, isError, error } = useQuery<Customer[]>({
    queryKey: ['customers-loyalty'],
    queryFn: fetchCustomers,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Star className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-headline font-semibold">Loyalty Program Dashboard</h2>
          <p className="text-sm text-muted-foreground">Oversee customer loyalty status and tier distribution.</p>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <div className="rounded-lg border shadow-sm bg-card p-4 space-y-3">
             <div className="flex justify-between items-center gap-4">
                <Skeleton className="h-5 w-1/12" />
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/4" />
             </div>
             {Array.from({length: 8}).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-full" />
                </div>
             ))}
         </div>
        </div>
      )}

      {isError && <p className="text-center text-destructive py-8">Error loading customer data: {error.message}</p>}

      {!isLoading && !isError && customers && (
         <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
                 <TierDistributionChart customers={customers} />
            </div>
            <div className="lg:col-span-3">
                 <LoyaltyCustomersTable customers={customers} />
            </div>
         </div>
      )}

       {!isLoading && !isError && customers?.length === 0 && (
         <Card className="mt-6">
            <CardContent className="pt-6">
                <div className="text-center py-10 text-muted-foreground">
                    <p className="font-semibold">No customers found.</p>
                    <p className="text-sm">Register customers and complete sessions to see loyalty data here.</p>
                </div>
            </CardContent>
         </Card>
       )}
    </div>
  );
}
