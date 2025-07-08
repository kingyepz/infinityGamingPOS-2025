
"use client";

import { StatCard } from '@/components/ui/stat-card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle, Users, Target, BarChart, Repeat, Gift, Coins } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface LoyaltyKpiGridProps {
  stats: any;
  isLoading: boolean;
}

interface KpiConfigItem {
  key: string;
  title: string;
  icon: LucideIcon;
  description: string;
  format: (value: number) => string;
  linkTo?: string;
}

const kpiConfig: KpiConfigItem[] = [
  {
    key: 'activeMembers30',
    title: 'Active Members (30d)',
    icon: Users,
    description: 'Customers active in the last 30 days.',
    format: (value: number) => value.toLocaleString(),
    linkTo: '/customers',
  },
  {
    key: 'redemptionRate',
    title: 'Redemption Rate',
    icon: Target,
    description: '% of points earned that have been redeemed.',
    format: (value: number) => `${value.toFixed(1)}%`,
  },
  {
    key: 'avgPointsPerSession',
    title: 'Avg. Points/Session',
    icon: BarChart,
    description: 'Average points awarded per gaming session.',
    format: (value: number) => `${Math.round(value).toLocaleString()} pts`,
  },
  {
    key: 'signupBonusConversionRate',
    title: 'Signup Conversion',
    icon: Repeat,
    description: '% of sign-up bonus recipients who returned.',
    format: (value: number) => `${value.toFixed(1)}%`,
  },
  {
    key: 'birthdayUtilizationRate',
    title: 'Birthday Reward Use',
    icon: Gift,
    description: '% of birthday offers that were redeemed.',
    format: (value: number) => `${value.toFixed(1)}%`,
  },
  {
    key: 'pendingBirthdayRewards',
    title: 'Pending Birthday Rewards',
    icon: Gift,
    description: 'Number of active, unclaimed birthday rewards.',
    format: (value: number) => value.toLocaleString(),
    linkTo: '/customers',
  },
  {
    key: 'totalPointsOutstanding',
    title: 'Total Points Outstanding',
    icon: Coins,
    description: 'All unredeemed loyalty points in the system.',
    format: (value: number) => value.toLocaleString(),
    linkTo: '/customers',
  },
];

export default function LoyaltyKpiGrid({ stats, isLoading }: LoyaltyKpiGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {kpiConfig.map((kpi) => (
        <TooltipProvider key={kpi.key}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard
                  title={kpi.title}
                  value={stats ? kpi.format(stats[kpi.key] ?? 0) : '0'}
                  icon={kpi.icon}
                  isLoading={isLoading}
                  linkTo={kpi.linkTo}
                  description={
                     <span className="flex items-center text-xs text-muted-foreground">
                        <HelpCircle className="h-3 w-3 mr-1.5 flex-shrink-0" />
                        {kpi.description}
                     </span>
                  }
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{kpi.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}
