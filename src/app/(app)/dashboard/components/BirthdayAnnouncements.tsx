
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Cake, Gift } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface BirthdayCustomer {
    id: string;
    full_name: string;
    dob: string; // YYYY-MM-DD
}

const fetchBirthdayCustomers = async (): Promise<{ today: BirthdayCustomer[], upcoming: BirthdayCustomer[] }> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .rpc('get_birthday_customers');

    if (error) {
        console.error("Error fetching birthday customers:", error);
        throw new Error(`Could not fetch birthday customers. This likely means the required database function 'get_birthday_customers' is missing. Please check the SQL provided. DB Error: ${error.message}`);
    }
    // The RPC returns a single object with 'today' and 'upcoming' keys
    return data;
};

export function BirthdayAnnouncements() {
    const { data, isLoading, isError, error } = useQuery<{ today: BirthdayCustomer[], upcoming: BirthdayCustomer[] }>({
        queryKey: ['birthdayCustomers'],
        queryFn: fetchBirthdayCustomers,
        refetchInterval: 60 * 60 * 1000, // Refetch every hour
    });

    const formatUpcomingDate = (isoDate: string) => {
        // We receive 'YYYY-MM-DD'
        const date = parseISO(isoDate); // e.g. 2000-11-25 becomes a Date object.
        return format(date, 'MMMM do'); // "November 25th"
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
                                <ul className="space-y-1 pl-6">
                                    {data.today.map(customer => (
                                        <li key={customer.id} className="text-sm text-foreground/90 list-disc">{customer.full_name}</li>
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
                                        <li key={customer.id} className="text-sm text-foreground/90 list-disc">
                                            {customer.full_name} - <span className="text-muted-foreground">{formatUpcomingDate(customer.dob)}</span>
                                        </li>
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
