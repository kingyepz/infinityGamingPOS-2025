
"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentData {
    name: string;
    value: number;
    color: string;
}

const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const fetchPaymentMethods = async () => {
    const supabase = createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('sessions')
        .select('payment_method, amount_charged')
        .eq('payment_status', 'paid')
        .gte('end_time', today.toISOString());

    if (error) {
        console.error("Error fetching payment methods:", error);
        throw new Error(error.message);
    }

    const aggregated = data.reduce((acc, session) => {
        const method = session.payment_method || 'Unknown';
        const amount = session.amount_charged || 0;
        acc[method] = (acc[method] || 0) + amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(aggregated)
        .map(([name, value], index) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: colors[index % colors.length]
        }));
};

export function PaymentMethodChart() {
    const { data, isLoading, isError, error } = useQuery<PaymentData[]>({
        queryKey: ['paymentMethodsToday'],
        queryFn: fetchPaymentMethods
    });

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="text-xl font-headline">Payment Methods</CardTitle>
                <CardDescription>Breakdown of revenue by payment type today.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex items-center justify-center h-[250px]">
                        <Skeleton className="h-48 w-48 rounded-full" />
                    </div>
                ) : isError ? (
                     <p className="text-center text-destructive py-4">Error: {error.message}</p>
                ) : data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Tooltip
                                contentStyle={{
                                    background: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                    color: "hsl(var(--foreground))"
                                }}
                                formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(value)}
                            />
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                dataKey="value"
                                nameKey="name"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                                ))}
                            </Pie>
                            <Legend iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[250px]">
                        <p className="text-center text-muted-foreground">No payment data for today.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
