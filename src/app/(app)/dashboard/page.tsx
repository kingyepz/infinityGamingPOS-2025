
"use client";

import { DollarSign, Gamepad2, Users, ArrowUp } from 'lucide-react';
import { StatCard } from './components/StatCard';
import { WelcomeHeader } from './components/WelcomeHeader';
import { QuickActions } from './components/QuickActions';
import { RevenueTrendChart } from './components/RevenueTrendChart';
import { SessionTypeDistributionChart } from './components/SessionTypeDistributionChart';
import { HourlyActivityChart } from './components/HourlyActivityChart';
import { RecentActivityTabs } from './components/RecentActivityTabs';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  // Mock data for demonstration
  const activeSessionsCount = 12;
  const todaysRevenue = "KES 15,650.00";
  const newCustomersCount = 8;

  return (
    <div className="space-y-6">
      <WelcomeHeader />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Active Sessions"
          value={`${activeSessionsCount}`}
          icon={Gamepad2}
          description="Click to view all active sessions"
          linkTo="/sessions"
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
          linkTo="/customers"
        />
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <RevenueTrendChart />
          <HourlyActivityChart />
        </div>
        <div className="xl:col-span-2 space-y-6">
          <SessionTypeDistributionChart />
          <RecentActivityTabs />
        </div>
      </div>
    </div>
  );
}
