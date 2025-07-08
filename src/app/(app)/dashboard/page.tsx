
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Gamepad2, Users, Timer, Wallet, Star, UserPlus } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { WelcomeHeader } from './components/WelcomeHeader';
import { QuickActions } from './components/QuickActions';
import { RevenueTrendChart } from './components/RevenueTrendChart';
import { HourlyActivityChart } from './components/HourlyActivityChart';
import { RecentActivityTabs } from './components/RecentActivityTabs';
import { PaymentMethodChart } from './components/PaymentMethodChart';
import { ConsoleUtilization } from './components/ConsoleUtilization';
import { TopCustomers } from './components/TopCustomers';
import { PopularGamesChart } from './components/PopularGamesChart';
import { BirthdayAnnouncements } from './components/BirthdayAnnouncements';
import { createClient } from '@/lib/supabase/client';
import { CURRENCY_SYMBOL } from '@/lib/constants';

// Function to fetch all dashboard stats from the new Supabase RPC function
const fetchDashboardStats = async () => {
  const supabase = createClient();
  // This single RPC call replaces the complex Promise.all logic
  const { data, error } = await supabase.rpc('get_dashboard_stats_today');

  if (error) {
    console.error("Error fetching dashboard stats via RPC:", error);
    throw new Error(`Database RPC error: ${error.message}. Please ensure the 'get_dashboard_stats_today' function is created in your Supabase SQL Editor.`);
  }

  // Format the duration string from the returned minutes
  const avgSessionDuration = `${Math.floor((data.avgSessionDurationMins || 0) / 60)}h ${Math.round((data.avgSessionDurationMins || 0) % 60)}min`;
  
  return {
    ...data,
    avgSessionDuration,
  };
};


export default function DashboardPage() {
    const { data: stats, isLoading, isError, error } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: fetchDashboardStats,
        refetchInterval: 30000,
    });
    
  return (
    <div className="flex-1 space-y-6 bg-muted/30 p-4 sm:p-6 lg:p-8">
      <WelcomeHeader />

      {isError && (
          <div className="p-4 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <p>Error loading dashboard data: {error.message}</p>
          </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <StatCard
          title="Active Sessions"
          value={stats?.activeSessionsCount?.toString() ?? '0'}
          icon={Gamepad2}
          description="Click to view all active sessions"
          linkTo='/sessions'
          isLoading={isLoading}
        />
        <StatCard
          title="Today's Revenue"
          value={`${CURRENCY_SYMBOL} ${stats?.todaysRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`}
          icon={DollarSign}
          description={<span className="text-green-500">Updated in real-time</span>}
          isLoading={isLoading}
        />
         <StatCard
          title="Total Customers"
          value={stats?.totalCustomersCount?.toLocaleString() ?? '0'}
          icon={Users}
          description="Total registered customers"
          linkTo='/customers'
          isLoading={isLoading}
        />
        <StatCard
          title="New Customers Today"
          value={`+${stats?.newCustomersCount ?? '0'}`}
          icon={UserPlus}
          description="Welcome our new gamers!"
          linkTo='/customers'
          isLoading={isLoading}
        />
        <StatCard
          title="Avg. Transaction Value"
          value={`${CURRENCY_SYMBOL} ${stats?.avgTransactionValue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`}
          icon={Wallet}
          description="Average spend per transaction"
          isLoading={isLoading}
        />
         <StatCard
          title="Total Loyalty Points"
          value={stats?.totalLoyaltyPoints?.toLocaleString() ?? '0'}
          icon={Star}
          description="All points held by customers"
          linkTo='/loyalty'
          isLoading={isLoading}
        />
         <StatCard
          title="Avg. Session Duration"
          value={stats?.avgSessionDuration ?? '0h 0min'}
          icon={Timer}
          description="Typical engagement time"
          isLoading={isLoading}
        />
         <StatCard
          title="Loyalty Points Earned Today"
          value={stats?.loyaltyPointsToday?.toLocaleString() ?? '0'}
          icon={Star}
          description="From new sessions and bonuses"
          isLoading={isLoading}
        />
      </div>

      <QuickActions />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <RevenueTrendChart />
                <HourlyActivityChart />
                <PopularGamesChart />
            </div>
            <div className="space-y-6 lg:col-span-1">
                <BirthdayAnnouncements />
                <TopCustomers />
                <PaymentMethodChart />
                <ConsoleUtilization />
            </div>
        </div>
        <div className="grid grid-cols-1 pt-6">
            <RecentActivityTabs />
        </div>
    </div>
  );
}
