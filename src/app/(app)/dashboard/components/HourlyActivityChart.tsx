
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';


const fetchHourlyActivity = async () => {
    const supabase = createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('sessions')
        .select('start_time')
        .gte('start_time', today.toISOString());

    if (error) {
        console.error("Error fetching hourly activity:", error);
        throw new Error(error.message);
    }
    return data;
}

export function HourlyActivityChart() {
    const { data: activityData, isLoading, isError, error } = useQuery({
        queryKey: ['hourlyActivity'],
        queryFn: fetchHourlyActivity,
    });

    const processData = () => {
        const hourlyCounts: { [key: string]: number } = {};
        for(let i=0; i<24; i++) {
            const hour = i.toString().padStart(2, '0');
            hourlyCounts[hour] = 0;
        }

        if(activityData) {
            activityData.forEach(session => {
                const hour = format(parseISO(session.start_time), 'HH');
                hourlyCounts[hour]++;
            });
        }
        
        // Return only hours with activity or a subset of hours for better display
        return Object.entries(hourlyCounts)
            .filter(([hour, count]) => parseInt(hour) >= 8 && parseInt(hour) <= 22) // Office hours
            .map(([hour, sessions]) => ({
                hour: format(new Date(2024, 0, 1, parseInt(hour)), 'ha').toLowerCase(), // e.g., 8am, 9pm
                sessions
            }));
    };

    const chartData = processData();

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="text-xl font-headline">Hourly Activity</CardTitle>
                <CardDescription>Number of sessions started throughout the day.</CardDescription>
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
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    background: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                    color: "hsl(var(--foreground))"
                                }}
                                cursor={{ fill: 'hsl(var(--primary))', fillOpacity: 0.1 }}
                            />
                            <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
