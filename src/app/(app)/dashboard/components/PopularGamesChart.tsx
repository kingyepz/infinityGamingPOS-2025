
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface GameSessionCount {
  name: string;
  sessions: number;
}

const fetchPopularGames = async (): Promise<GameSessionCount[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('game_id, games(name)')
    .not('game_id', 'is', null);

  if (error) {
    console.error("Error fetching popular games:", error);
    throw new Error(error.message);
  }

  const gameCounts = data.reduce((acc, session) => {
    if (session.games) {
      const gameName = session.games.name;
      acc[gameName] = (acc[gameName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(gameCounts)
    .map(([name, sessions]) => ({ name, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 5); // Top 5
};

export function PopularGamesChart() {
  const { data: popularGames, isLoading, isError, error } = useQuery({
    queryKey: ['popularGames'],
    queryFn: fetchPopularGames,
  });

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Most Popular Games</CardTitle>
        <CardDescription>Top 5 most played games across all sessions.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4 pt-2 pl-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : isError ? (
          <p className="text-center text-destructive py-4">Error: {error.message}</p>
        ) : popularGames && popularGames.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularGames} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tick={{ textAnchor: 'end', dx: -5 }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--foreground))"
                }}
              />
              <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
           <div className="flex items-center justify-center h-[300px]">
              <p className="text-center text-muted-foreground">No game session data available yet.</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
}
