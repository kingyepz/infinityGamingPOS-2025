
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Gamepad2, Users, Timer, ShieldX, Wallet, Star, UserPlus } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { WelcomeHeader } from './components/WelcomeHeader';
import { QuickActions } from './components/QuickActions';
import { RevenueTrendChart } from './components/RevenueTrendChart';
import { SessionTypeDistributionChart } from './components/SessionTypeDistributionChart';
import { HourlyActivityChart } from './components/HourlyActivityChart';
import { RecentActivityTabs } from './components/RecentActivityTabs';
import { PaymentMethodChart } from './components/PaymentMethodChart';
import { ConsoleUtilization } from './components/ConsoleUtilization';
import { StaffPerformance } from './components/StaffPerformance';
import { createClient } from '@/lib/supabase/client';
import { CURRENCY_SYMBOL } from '@/lib/constants';

// Function to fetch all dashboard stats from Supabase concurrently
const fetchDashboardStats = async () => {
  const supabase = createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    { count: activeSessionsCount, error: activeSessionsError },
    { data: paidSessions, error: revenueError },
    { count: newCustomersCount, error: newCustomersError },
    { data: cancelledSessions, error: refundsError },
    { data: loyaltyData, error: loyaltyError },
    { count: totalCustomersCount, error: totalCustomersError },
  ] = await Promise.all([
    supabase.from('game_sessions').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
    supabase.from('game_sessions').select('total_amount, duration_minutes').eq('payment_status', 'paid').gte('end_time', todayStart.toISOString()).lte('end_time', todayEnd.toISOString()),
    supabase.from('customers').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).lte('created_at', todayEnd.toISOString()),
    supabase.from('game_sessions').select('total_amount').eq('payment_status', 'cancelled').gte('end_time', todayStart.toISOString()).lte('end_time', todayEnd.toISOString()),
    supabase.from('game_sessions').select('points_awarded').eq('payment_status', 'paid').gte('end_time', todayStart.toISOString()).lte('end_time', todayEnd.toISOString()),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
  ]);

  // Centralized Error Handling
  if (activeSessionsError || revenueError || newCustomersError || refundsError || loyaltyError || totalCustomersError) {
    console.error({ activeSessionsError, revenueError, newCustomersError, refundsError, loyaltyError, totalCustomersError });
    throw new Error('Failed to fetch one or more dashboard statistics.');
  }

  // Calculations
  const todaysRevenue = paidSessions?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
  const transactionCount = paidSessions?.length || 0;
  const avgTransactionValue = transactionCount > 0 ? todaysRevenue / transactionCount : 0;
  const refundsTodayValue = cancelledSessions?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
  const totalDuration = paidSessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
  const avgSessionDurationMins = transactionCount > 0 ? totalDuration / transactionCount : 0;
  const loyaltyPointsToday = loyaltyData?.reduce((sum, s) => sum + (s.points_awarded || 0), 0) || 0;

  return {
    activeSessionsCount: activeSessionsCount ?? 0,
    todaysRevenue,
    newCustomersCount: newCustomersCount ?? 0,
    totalCustomersCount: totalCustomersCount ?? 0,
    avgTransactionValue,
    refundsTodayValue,
    refundsTodayCount: cancelledSessions?.length || 0,
    avgSessionDuration: `${Math.floor(avgSessionDurationMins / 60)}h ${Math.round(avgSessionDurationMins % 60)}min`,
    loyaltyPointsToday,
  };
};


export default function DashboardPage() {
    const { data: stats, isLoading, isError, error } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: fetchDashboardStats,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
    
    // In a real app, user role would likely come from context or a dedicated user hook
    const userRole = 'admin'; // For demonstration

  return (
    <div className="flex-1 space-y-6 bg-muted/30 p-4 sm:p-6 lg:p-8">
      <WelcomeHeader />

      {isError && (
          <div className="p-4 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <p>Error loading dashboard data: {error.message}</p>
          </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
          title="Refunds / Voids"
          value={`${CURRENCY_SYMBOL} ${stats?.refundsTodayValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`}
          icon={ShieldX}
          description={`${stats?.refundsTodayCount ?? 0} transactions voided today`}
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
          title="Loyalty Points Earned"
          value={stats?.loyaltyPointsToday.toLocaleString() ?? '0'}
          icon={Star}
          description="Total points awarded today"
          isLoading={isLoading}
        />
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <RevenueTrendChart />
           <ConsoleUtilization />
           <HourlyActivityChart />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <SessionTypeDistributionChart />
          <PaymentMethodChart />
          {userRole === 'admin' && <StaffPerformance />}
          <RecentActivityTabs />
        </div>
      </div>
    </div>
  );
}
