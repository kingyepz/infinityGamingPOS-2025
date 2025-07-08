
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Cake, Gift, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface BirthdayCustomer {
    id: string;
    full_name: string;
    // For today's birthdays, `dob` is present.
    dob?: string;
    // For upcoming birthdays, `next_birthday_date` is present.
    next_birthday_date?: string;
    offer?: {
      id: string;
      description: string;
    } | null;
}

const fetchBirthdayCustomers = async (): Promise<{ today: BirthdayCustomer[], upcoming: BirthdayCustomer[] }> => {
    const supabase = createClient();
    
    // First, silently try to grant rewards. This is safe to call multiple times.
    // The DB function has logic to prevent duplicate rewards.
    const { error: grantError } = await supabase.rpc('grant_birthday_rewards');
    if (grantError) {
        // Log the error but don't block the UI. This might happen if the function
        // is run by a user without sufficient permissions, which is expected.
        // A server-side cron job is the primary/production way this should run.
        console.warn("Could not run grant_birthday_rewards from client:", grantError.message);
    }

    const { data, error } = await supabase
        .rpc('get_birthday_customers');

    if (error) {
        console.error("Error fetching birthday customers:", error);
        throw new Error(`Could not fetch birthday customers. This likely means the required database function 'get_birthday_customers' is missing or has an error. Please check the SQL provided. DB Error: ${error.message}`);
    }
    // The RPC returns a single object with 'today' and 'upcoming' keys
    return data;
};

export function BirthdayAnnouncements() {
    const { data, isLoading, isError, error, refetch } = useQuery<{ today: BirthdayCustomer[], upcoming: BirthdayCustomer[] }>({
        queryKey: ['birthdayCustomers'],
        queryFn: fetchBirthdayCustomers,
        refetchOnWindowFocus: true,
    });

    const formatUpcomingDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return format(date, 'MMMM do');
    }

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="text-xl font-headline">Birthday Corner</CardTitle>
                <CardDescription>Celebrate with your loyal customers.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                             <Skeleton className="h-5 w-5 rounded-full" />
                             <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-8 w-full" />
                        <Separator />
                        <div className="flex items-center gap-2">
                             <Skeleton className="h-5 w-5 rounded-full" />
                             <Skeleton className="h-5 w-32" />
                        </div>
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : isError ? (
                    <p className="text-center text-destructive py-4 text-xs">{error.message}</p>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <h4 className="flex items-center text-sm font-semibold mb-2">
                                <Cake className="h-4 w-4 mr-2 text-primary" />
                                Today's Birthdays
                            </h4>
                            {data?.today && data.today.length > 0 ? (
                                <ul className="space-y-2 pl-1">
                                    {data.today.map(customer => (
                                        <li key={customer.id} className="text-sm flex flex-col items-start gap-1 p-2 rounded-md bg-muted/50">
                                            <span className="font-medium text-foreground/90">{customer.full_name}</span>
                                            {customer.offer ? (
                                                <Button asChild size="sm" variant="outline" className="h-7 bg-green-500/10 border-green-500/50 text-green-700 hover:bg-green-500/20 hover:text-green-800">
                                                  <Link href={`/sessions?customerId=${customer.id}&offerId=${customer.offer.id}`}>
                                                    <Sparkles className="h-3 w-3 mr-1.5" /> Redeem Free Session
                                                  </Link>
                                                </Button>
                                            ) : (
                                                 <span className="text-xs text-muted-foreground italic">Reward already claimed.</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground pl-6">No birthdays today.</p>
                            )}
                        </div>

                        <Separator />

                        <div>
                            <h4 className="flex items-center text-sm font-semibold mb-2">
                                <Gift className="h-4 w-4 mr-2 text-yellow-500" />
                                Upcoming Birthdays
                            </h4>
                            {data?.upcoming && data.upcoming.length > 0 ? (
                                <ul className="space-y-1 pl-6">
                                    {data.upcoming.map(customer => (
                                        customer.next_birthday_date && (
                                            <li key={customer.id} className="text-sm text-foreground/90 list-disc">
                                                {customer.full_name} - <span className="text-muted-foreground">{formatUpcomingDate(customer.next_birthday_date)}</span>
                                            </li>
                                        )
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground pl-6">No upcoming birthdays in the next week.</p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
