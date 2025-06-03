
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Gamepad2, Clock, LogOut, Loader2 } from "lucide-react";
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

interface DashboardStat {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: string; // e.g., "+5.2% from last month"
}

const DashboardCard: React.FC<DashboardStat> = ({ title, value, icon: Icon, description, trend }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">
        {typeof value === 'number' && title.toLowerCase().includes('revenue') ? `${CURRENCY_SYMBOL} ${value.toLocaleString()}` : value.toString()}
      </div>
      {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
      {trend && <p className="text-xs text-green-600 dark:text-green-400 pt-1">{trend}</p>}
    </CardContent>
  </Card>
);

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
      { title: "Average Session Time", value: "75 min", icon: Clock, description: "For completed sessions today" },
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
      router.push('/login'); // Redirect to login after successful logout
      router.refresh(); // Ensure a full refresh to clear any cached user state
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Recent activity feed or quick overview chart would go here.</p>
            <div className="mt-4 h-64 bg-muted rounded-md flex items-center justify-center">
              <p className="text-sm text-muted-foreground">[Chart Placeholder]</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Popular Games</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">A list or chart of most played games.</p>
            <ul className="mt-4 space-y-2">
              <li className="text-sm">1. Apex Legends - 15 sessions</li>
              <li className="text-sm">2. FIFA 2024 - 12 sessions</li>
              <li className="text-sm">3. Call of Duty - 10 sessions</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
