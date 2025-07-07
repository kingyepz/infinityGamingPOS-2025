
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Gamepad2, Clock, LogOut, Loader2, Trophy, BarChart3, TrendingUp } from "lucide-react";
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import RevenueChart from './components/RevenueChart';
import { Badge } from '@/components/ui/badge';

interface DashboardStat {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: string;
}

const DashboardCard: React.FC<DashboardStat> = ({ title, value, icon: Icon, description, trend }) => (
  <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300 border-border/60">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">
        {typeof value === 'number' && title.toLowerCase().includes('revenue') ? `${CURRENCY_SYMBOL} ${value.toLocaleString()}` : value.toString()}
      </div>
      {trend && <p className="text-xs text-green-600 dark:text-green-400 pt-1 flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> {trend}</p>}
      {description && !trend && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
    </CardContent>
  </Card>
);

const popularGames = [
    { name: "Apex Legends", sessions: 15, icon: Trophy },
    { name: "FIFA 2024", sessions: 12, icon: Trophy },
    { name: "Call of Duty", sessions: 10, icon: Gamepad2 },
    { name: "Spider-Man 2", sessions: 8, icon: Gamepad2 },
];

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardStat[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, fetch this data from an API
    setDashboardData([
      { title: "Total Revenue (Today)", value: 12500, icon: DollarSign, trend: "+10% from yesterday" },
      { title: "Active Game Sessions", value: 8, icon: Gamepad2, description: "Across all consoles" },
      { title: "New Customers (Today)", value: 5, icon: Users, trend: "+2 since yesterday" },
      { title: "Peak Hours", value: "8-10 PM", icon: Clock, description: "Most active time slot" },
    ]);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout Failed",
        description: error.message || "Could not log out. Please try again.",
        variant: "destructive",
      });
      setIsLoggingOut(false);
    } else {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Dashboard Overview</h1>
        <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging Out...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardData.map((stat) => (
          <DashboardCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueChart />
        <Card className="shadow-lg border-none bg-secondary/50">
          <CardHeader>
            <CardTitle>Popular Games</CardTitle>
            <CardDescription>Most played games this week.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {popularGames.map((game, index) => (
                <li key={game.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <game.icon className={`h-5 w-5 ${index === 0 ? 'text-yellow-500' : (index === 1 ? 'text-slate-400' : 'text-amber-700')}`} />
                    <span className="font-medium">{game.name}</span>
                  </div>
                  <Badge variant={index < 2 ? "default" : "secondary"} className="font-mono">{game.sessions} sessions</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
