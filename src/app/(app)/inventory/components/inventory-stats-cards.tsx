"use client";

import React from 'react';
import { Package, TrendingUp, AlertTriangle, DollarSign, BarChart3, ShoppingCart } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import type { InventoryStats } from '@/types';

interface InventoryStatsCardsProps {
  stats?: InventoryStats;
  isLoading: boolean;
}

export function InventoryStatsCards({ stats, isLoading }: InventoryStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Total Items"
        value={stats?.total_items?.toString() ?? '0'}
        icon={Package}
        description="Items in inventory"
        isLoading={isLoading}
      />
      <StatCard
        title="Stock Value"
        value={`${CURRENCY_SYMBOL} ${stats?.total_stock_value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`}
        icon={DollarSign}
        description="Total inventory value"
        isLoading={isLoading}
      />
      <StatCard
        title="Low Stock Items"
        value={stats?.low_stock_items?.toString() ?? '0'}
        icon={AlertTriangle}
        description="Items needing restock"
        isLoading={isLoading}
        className={stats?.low_stock_items > 0 ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20" : ""}
      />
      <StatCard
        title="Expiring Soon"
        value={stats?.expiring_items?.toString() ?? '0'}
        icon={BarChart3}
        description="Items expiring in 7 days"
        isLoading={isLoading}
        className={stats?.expiring_items > 0 ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20" : ""}
      />
      <StatCard
        title="Today's Sales"
        value={stats?.total_transactions_today?.toString() ?? '0'}
        icon={ShoppingCart}
        description="Transactions today"
        isLoading={isLoading}
      />
      <StatCard
        title="Today's Revenue"
        value={`${CURRENCY_SYMBOL} ${stats?.revenue_today?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`}
        icon={TrendingUp}
        description="From inventory sales"
        isLoading={isLoading}
      />
    </div>
  );
}