
"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { subDays, format, parseISO, eachDayOfInterval, startOfDay } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

// Fetch paid sessions from the last 7 days
const fetchWeeklyRevenue = async () => {
    const supabase = createClient();
    const today = new Date();
    const sevenDaysAgo = subDays(today, 6); // Include today + 6 past days

    const { data, error } = await supabase
        .from('sessions')
        .select('end_time, amount_charged')
        .eq('payment_status', 'paid')
        .gte('end_time', sevenDaysAgo.toISOString())
        .lte('end_time', today.toISOString());

    if (error) {
        console.error("Error fetching weekly revenue:", error);
        throw new Error(error.message);
    }
    return data;
};

export function RevenueTrendChart() {
    const { data: revenueData, isLoading, isError, error } = useQuery({
        queryKey: ['weeklyRevenue'],
        queryFn: fetchWeeklyRevenue,
    });

    const processData = () => {
        if (!revenueData) return [];

        const today = startOfDay(new Date());
        const sevenDaysAgo = startOfDay(subDays(today, 6));

        // Create a map for each day in the last 7 days initialized to 0 revenue
        const dailyRevenue = new Map<string, number>();
        const interval = eachDayOfInterval({ start: sevenDaysAgo, end: today });
        interval.forEach(day => {
            dailyRevenue.set(format(day, 'yyyy-MM-dd'), 0);
        });
        
        // Aggregate revenue from fetched data
        revenueData.forEach(session => {
            if (session.end_time && session.amount_charged) {
                const day = format(parseISO(session.end_time), 'yyyy-MM-dd');
                if (dailyRevenue.has(day)) {
                    dailyRevenue.set(day, dailyRevenue.get(day)! + session.amount_charged);
                }
            }
        });
        
        // Convert map to array for the chart
        return Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({
            name: format(parseISO(date), 'EEE'), // Format as 'Mon', 'Tue', etc.
            revenue,
        }));
    };

    const chartData = processData();

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="text-xl font-headline">Revenue Trends</CardTitle>
                <CardDescription>Revenue from the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                 {isLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                        <Skeleton className="h-full w-full" />
                    </div>
                ) : isError ? (
                     <p className="text-center text-destructive py-4">Error: {error.message}</p>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${CURRENCY_SYMBOL} ${value / 1000}k`} />
                            <Tooltip
                                contentStyle={{
                                    background: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                    color: "hsl(var(--foreground))"
                                }}
                                cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1.5 }}
                                formatter={(value: number) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(value), 'Revenue']}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))" }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
