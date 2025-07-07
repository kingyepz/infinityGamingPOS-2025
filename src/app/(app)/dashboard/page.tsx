
"use client";

import { DollarSign, Gamepad2, Users, Receipt } from 'lucide-react';
import { StatCard } from './components/StatCard';
import { SalesOverviewChart } from './components/SalesOverviewChart';
import { RecentActivity } from './components/RecentActivity';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function DashboardPage() {
  // Mock data for demonstration
  const activeSessionsCount = 5; // Example value
  const newCustomersCount = 12; // Example value

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="KES 45,231.89"
          icon={DollarSign}
          description="+20.1% from last month"
        />
        <StatCard
          title="Active Sessions"
          value={`+${activeSessionsCount}`}
          icon={Gamepad2}
          description="Currently playing"
        />
        <StatCard
          title="New Customers"
          value={`+${newCustomersCount}`}
          icon={Users}
          description="+5 since yesterday"
        />
        <StatCard
          title="Total Transactions"
          value="+573"
          icon={Receipt}
          description="In the last 7 days"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-4">
           <SalesOverviewChart />
        </div>
        <div className="lg:col-span-3">
            <RecentActivity />
        </div>
      </div>
    </div>
  );
}
