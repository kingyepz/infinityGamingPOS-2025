
"use client";

import type { Customer } from '@/types';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMemo } from 'react';

interface TierDistributionChartProps {
  customers: Customer[];
}

const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum'];
const tierColors: { [key: string]: string } = {
  Bronze: 'hsl(var(--chart-5))', // amber-600 like
  Silver: 'hsl(var(--muted-foreground))', // slate-300 like
  Gold: 'hsl(var(--chart-4))', // yellow-400 like
  Platinum: 'hsl(var(--chart-2))', // sky-200 like
};

export default function TierDistributionChart({ customers }: TierDistributionChartProps) {
  const tierData = useMemo(() => {
    const counts = customers.reduce((acc, customer) => {
      const tier = customer.loyalty_tier || 'Bronze';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    // Ensure all tiers are present and in order
    return tierOrder.map(tier => ({
        name: tier,
        count: counts[tier] || 0,
        fill: tierColors[tier],
    }));
  }, [customers]);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Customer Tiers</CardTitle>
        <CardDescription>Distribution of customers across loyalty tiers.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={tierData} layout="vertical" margin={{ left: 10 }}>
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis 
                type="category" 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                width={80}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--primary))', fillOpacity: 0.1 }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                color: "hsl(var(--foreground))"
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
