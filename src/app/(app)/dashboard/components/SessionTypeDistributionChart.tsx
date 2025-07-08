
"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface BillingTypeData {
    name: string;
    value: number;
    color: string;
}

const fetchSessionTypes = async (): Promise<BillingTypeData[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('sessions')
        .select('session_type');

    if (error) {
        console.error("Error fetching session types:", error);
        throw new Error(error.message);
    }

    const counts = data.reduce((acc, session) => {
        const type = session.session_type === 'per-hour' ? 'Per Hour' : 'Per Game';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return [
        { name: 'Per Hour', value: counts['Per Hour'] || 0, color: 'hsl(var(--primary))' },
        { name: 'Per Game', value: counts['Per Game'] || 0, color: 'hsl(var(--chart-2))' },
    ];
};

export function SessionTypeDistributionChart() {
  const { data: chartData, isLoading, isError, error } = useQuery<BillingTypeData[]>({
      queryKey: ['sessionTypeDistribution'],
      queryFn: fetchSessionTypes,
  });

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Session Billing Types</CardTitle>
        <CardDescription>Breakdown of all historical billing preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
                <Skeleton className="h-56 w-56 rounded-full" />
            </div>
        ) : isError ? (
            <p className="text-center text-destructive py-4">Error: {error.message}</p>
        ) : chartData && chartData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--foreground))"
                  }}
                  formatter={(value: number) => [`${value} sessions`, 'Count']}
                />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} stroke={entry.color}/>
                  ))}
                </Pie>
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-[300px]">
                <p className="text-center text-muted-foreground">No session data available yet.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
