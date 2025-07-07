
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Customer } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface TopCustomer extends Pick<Customer, 'id' | 'full_name' | 'loyalty_points'> {}

// Fetches top 5 customers by loyalty points
const fetchTopCustomers = async (): Promise<TopCustomer[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, loyalty_points')
        .order('loyalty_points', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching top customers:", error);
        throw new Error(error.message);
    }
    return data;
};

// Modified to accept props from the main dashboard query
export function TopCustomers({ loyaltyPointsToday, isLoading: isDashboardLoading }: { loyaltyPointsToday?: number; isLoading?: boolean }) {
  const { data: topCustomers, isLoading: isComponentLoading, isError, error } = useQuery({
      queryKey: ['topCustomers'],
      queryFn: fetchTopCustomers,
      refetchInterval: 30000,
  });

  const getInitials = (name: string) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-headline">Top Customers</CardTitle>
              <CardDescription>Ranked by overall points.</CardDescription>
            </div>
             <Link href="/loyalty" passHref>
                <Button variant="outline" size="sm">View All</Button>
            </Link>
        </div>
        <Separator className="mt-2" />
        <div className="pt-3 text-sm flex justify-between items-center">
            <span className="text-muted-foreground">Total Points Awarded Today:</span>
            <span className="font-bold text-green-500">
                {isDashboardLoading ? <Skeleton className="h-5 w-12" /> : `+${loyaltyPointsToday?.toLocaleString() || 0}`}
            </span>
        </div>
      </CardHeader>
      <CardContent>
        {isComponentLoading ? (
          <div className="space-y-4">
             {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : isError ? (
           <p className="text-center text-destructive py-4">Error: {error.message}</p>
        ) : topCustomers && topCustomers.length > 0 ? (
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                   <AvatarImage src={`https://placehold.co/40x40.png`} alt={customer.full_name} data-ai-hint="avatar person" />
                  <AvatarFallback>{getInitials(customer.full_name)}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{customer.full_name}</p>
                </div>
                <div className="ml-auto font-medium text-right flex items-center gap-2">
                   {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                   <div className="flex items-center gap-1 text-primary font-mono">
                    <Star className="h-4 w-4" />
                    <span>{customer.loyalty_points.toLocaleString()} pts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-muted-foreground py-8">No customers with loyalty points yet.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
