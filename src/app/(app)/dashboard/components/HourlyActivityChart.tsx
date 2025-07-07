
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CURRENCY_SYMBOL } from '@/lib/constants';

const hourlyData = [
  { hour: '8am', sessions: 2, revenue: 400 },
  { hour: '9am', sessions: 5, revenue: 1000 },
  { hour: '10am', sessions: 8, revenue: 1600 },
  { hour: '11am', sessions: 7, revenue: 1450 },
  { hour: '12pm', sessions: 10, revenue: 2100 },
  { hour: '1pm', sessions: 12, revenue: 2500 },
  { hour: '2pm', sessions: 15, revenue: 3000 },
  { hour: '3pm', sessions: 18, revenue: 3800 },
  { hour: '4pm', sessions: 20, revenue: 4200 },
  { hour: '5pm', sessions: 25, revenue: 5000 },
  { hour: '6pm', sessions: 22, revenue: 4500 },
  { hour: '7pm', sessions: 18, revenue: 3900 },
  { hour: '8pm', sessions: 15, revenue: 3100 },
  { hour: '9pm', sessions: 10, revenue: 2200 },
];

export function HourlyActivityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Activity</CardTitle>
        <CardDescription>Number of active sessions throughout the day.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
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
      </CardContent>
    </Card>
  );
}
