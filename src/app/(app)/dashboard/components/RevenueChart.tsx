
"use client";

import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CURRENCY_SYMBOL } from '@/lib/constants';

// Hardcoded data to avoid server/client mismatch with Math.random
const data = [
  { date: 'Mon', revenue: 1250 },
  { date: 'Tue', revenue: 1800 },
  { date: 'Wed', revenue: 1600 },
  { date: 'Thu', revenue: 2100 },
  { date: 'Fri', revenue: 2500 },
  { date: 'Sat', revenue: 3200 },
  { date: 'Sun', revenue: 2800 },
];

export default function RevenueChart() {
    return (
        <Card className="shadow-lg col-span-1 lg:col-span-2 border-none bg-secondary/50">
            <CardHeader>
                <CardTitle>Weekly Revenue</CardTitle>
                <CardDescription>Revenue from the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} vertical={false} />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${CURRENCY_SYMBOL}${value / 1000}k`} />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                                color: "hsl(var(--foreground))"
                            }}
                            cursor={{ fill: "hsl(var(--primary))", fillOpacity: 0.1 }}
                            formatter={(value: number) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY_SYMBOL }).format(value), 'Revenue']}
                            labelClassName="font-bold"
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
