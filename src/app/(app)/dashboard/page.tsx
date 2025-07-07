
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Gamepad2, Users, Timer, ShieldX, Wallet, Star, UserPlus } from 'lucide-react';
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
import { createClient } from '@/lib/supabase/client';
import { CURRENCY_SYMBOL } from '@/lib/constants';

// Function to fetch all dashboard stats from Supabase concurrently
const fetchDashboardStats = async () => {
  const supabase = createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const promises = [
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
    supabase.from('sessions').select('amount_charged, duration_minutes').eq('payment_status', 'paid').gte('end_time', todayStart.toISOString()).lte('end_time', todayEnd.toISOString()),
    supabase.from('customers').select('*', { count: 'exact', head: true }).gte('join_date', todayStart.toISOString()).lte('join_date', todayEnd.toISOString()),
    supabase.from('sessions').select('amount_charged').eq('payment_status', 'cancelled').gte('end_time', todayStart.toISOString()).lte('end_time', todayEnd.toISOString()),
    supabase.from('loyalty_transactions').select('points').gte('created_at', todayStart.toISOString()).lte('created_at', todayEnd.toISOString()).in('transaction_type', ['earn', 'bonus']),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('loyalty_points'), // For total points
  ];

  const [
    activeSessionsResult,
    paidSessionsResult,
    newCustomersResult,
    cancelledSessionsResult,
    loyaltyDataResult,
    totalCustomersResult,
    allCustomersForPointsResult,
  ] = await Promise.all(promises);

  const results = {
    activeSessions: activeSessionsResult,
    paidSessions: paidSessionsResult,
    newCustomers: newCustomersResult,
    cancelledSessions: cancelledSessionsResult,
    loyaltyData: loyaltyDataResult,
    totalCustomers: totalCustomersResult,
    allCustomersForPoints: allCustomersForPointsResult,
  };

  for (const [key, result] of Object.entries(results)) {
    if (result.error) {
      console.error(`Error fetching ${key}:`, result.error);
      throw new Error(`Database error fetching ${key}: ${result.error.message}. Please check table names and Row Level Security policies in Supabase.`);
    }
  }
  
  const activeSessionsCount = activeSessionsResult.count ?? 0;
  const paidSessions = paidSessionsResult.data || [];
  const newCustomersCount = newCustomersResult.count ?? 0;
  const cancelledSessions = cancelledSessionsResult.data || [];
  const loyaltyData = loyaltyDataResult.data || [];
  const totalCustomersCount = totalCustomersResult.count ?? 0;
  const allCustomersForPoints = allCustomersForPointsResult.data || [];

  const todaysRevenue = paidSessions.reduce((sum, s) => sum + (s.amount_charged || 0), 0) || 0;
  const transactionCount = paidSessions.length || 0;
  const avgTransactionValue = transactionCount > 0 ? todaysRevenue / transactionCount : 0;
  const refundsTodayValue = cancelledSessions.reduce((sum, s) => sum + (s.amount_charged || 0), 0) || 0;
  const totalDuration = paidSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
  const avgSessionDurationMins = transactionCount > 0 ? totalDuration / transactionCount : 0;
  const loyaltyPointsToday = loyaltyData.reduce((sum, t) => sum + (t.points || 0), 0) || 0;
  const totalLoyaltyPoints = allCustomersForPoints.reduce((sum, c) => sum + (c.loyalty_points || 0), 0) || 0;

  return {
    activeSessionsCount,
    todaysRevenue,
    newCustomersCount,
    totalCustomersCount,
    avgTransactionValue,
    refundsTodayValue,
    refundsTodayCount: cancelledSessions.length || 0,
    avgSessionDuration: `${Math.floor(avgSessionDurationMins / 60)}h ${Math.round(avgSessionDurationMins % 60)}min`,
    loyaltyPointsToday,
    totalLoyaltyPoints,
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
          value={stats?.activeSessionsCount.toString() ?? '0'}
          icon={Gamepad2}
          description="Click to view all active sessions"
          linkTo='/sessions'
          isLoading={isLoading}
        />
        <StatCard
          title="Today's Revenue"
          value={`${CURRENCY_SYMBOL} ${stats?.todaysRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`}
          icon={DollarSign}
          description={<span className="text-green-500">Updated in real-time</span>}
          isLoading={isLoading}
        />
         <StatCard
          title="Total Customers"
          value={stats?.totalCustomersCount.toLocaleString() ?? '0'}
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
          value={`${CURRENCY_SYMBOL} ${stats?.avgTransactionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`}
          icon={Wallet}
          description="Average spend per transaction"
          isLoading={isLoading}
        />
         <StatCard
          title="Total Loyalty Points"
          value={stats?.totalLoyaltyPoints.toLocaleString() ?? '0'}
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
          value={stats?.loyaltyPointsToday.toLocaleString() ?? '0'}
          icon={Star}
          description="Total points awarded today"
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
                <TopCustomers loyaltyPointsToday={stats?.loyaltyPointsToday} isLoading={isLoading} />
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
