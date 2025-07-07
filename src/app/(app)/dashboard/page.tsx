
"use client";

import React, { useState, useEffect } from 'react';
import { DollarSign, Gamepad2, Users, ArrowUp, Timer, ShieldX, Wallet, Star } from 'lucide-react';
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
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';


export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (data) {
          setUserRole(data.role);
        } else {
            console.warn("Dashboard: Could not fetch user role.", error?.message)
        }
      }
    };
    fetchUserRole();
  }, [supabase]);

  // Mock data for demonstration
  const activeSessionsCount = 12;
  const todaysRevenue = "KES 15,650.00";
  const newCustomersCount = 8;
  const avgTransactionValue = "KES 1,304.17";
  const refundsToday = "KES 500.00";
  const avgSessionDuration = "1h 15min";
  const loyaltyPointsToday = "1,565";

  return (
    <div className="space-y-6">
      <WelcomeHeader />

      <QuickActions />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Sessions"
          value={`${activeSessionsCount}`}
          icon={Gamepad2}
          description="Click to view all active sessions"
        />
        <StatCard
          title="Today's Revenue"
          value={todaysRevenue}
          icon={DollarSign}
          description="+15.5% from yesterday"
        />
        <StatCard
          title="New Customers Today"
          value={`+${newCustomersCount}`}
          icon={Users}
          description="Welcome our new gamers!"
        />
        <StatCard
          title="Avg. Transaction Value"
          value={avgTransactionValue}
          icon={Wallet}
          description="Average spend per transaction"
        />
         <StatCard
          title="Refunds / Voids"
          value={refundsToday}
          icon={ShieldX}
          description="2 transactions voided today"
        />
         <StatCard
          title="Avg. Session Duration"
          value={avgSessionDuration}
          icon={Timer}
          description="Typical engagement time"
        />
         <StatCard
          title="Loyalty Points Earned"
          value={loyaltyPointsToday}
          icon={Star}
          description="Total points awarded today"
        />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <RevenueTrendChart />
           <ConsoleUtilization />
           <HourlyActivityChart />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <SessionTypeDistributionChart />
          <PaymentMethodChart />
          {userRole === 'admin' && <StaffPerformance />}
          <RecentActivityTabs />
        </div>
      </div>
    </div>
  );
}

