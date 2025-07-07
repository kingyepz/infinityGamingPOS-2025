
"use client";

import { Button } from "@/components/ui/button";
import { SalesOverviewChart } from './components/SalesOverviewChart';
import { WelcomeCard } from './components/WelcomeCard';
import { SalesBySource } from './components/SalesBySource';
import { CategoryList } from './components/CategoryList';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">Yesterday</Button>
          <Button variant="ghost" size="sm">Week</Button>
          <Button variant="secondary" size="sm">Month</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <SalesOverviewChart />
          <SalesBySource />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <WelcomeCard />
          <CategoryList />
        </div>
      </div>
    </div>
  );
}
