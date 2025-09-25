"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, TrendingUp, AlertTriangle, DollarSign, BarChart3, Plus } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { InventoryTable } from './components/inventory-table';
import { InventoryStatsCards } from './components/inventory-stats-cards';
import { TopSellingItems } from './components/top-selling-items';
import { CategoryBreakdown } from './components/category-breakdown';
import { LowStockAlerts } from './components/low-stock-alerts';
import { ExpiringItems } from './components/expiring-items';
import { Button } from '@/components/ui/button';
import { AddItemDialog } from './components/add-item-dialog';
import { createClient } from '@/lib/supabase/client';
import { CURRENCY_SYMBOL } from '@/lib/constants';

// Function to fetch inventory statistics
const fetchInventoryStats = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_inventory_stats');

  if (error) {
    console.error("Error fetching inventory stats:", error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
};

// Function to fetch inventory items
const fetchInventoryItems = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching inventory items:", error);
    throw new Error(`Database error: ${error.message}`);
  }

  // Add computed fields
  const itemsWithComputed = data.map(item => ({
    ...item,
    stock_value: item.unit_price * item.stock_quantity,
    is_low_stock: item.stock_quantity < 5,
    days_to_expiry: item.expiry_date 
      ? Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null
  }));

  return itemsWithComputed;
};

export default function InventoryPage() {
  const [showAddDialog, setShowAddDialog] = React.useState(false);

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['inventoryStats'],
    queryFn: fetchInventoryStats,
    refetchInterval: 30000,
  });

  const { data: items, isLoading: itemsLoading, isError: itemsError } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: fetchInventoryItems,
    refetchInterval: 30000,
  });

  return (
    <div className="flex-1 space-y-6 bg-muted/30 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your gaming lounge inventory, track stock levels, and monitor sales performance.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Error Handling */}
      {(statsError || itemsError) && (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <p>Error loading inventory data: {(statsError || itemsError)?.message}</p>
        </div>
      )}

      {/* Stats Cards */}
      <InventoryStatsCards stats={stats} isLoading={statsLoading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Table */}
        <div className="lg:col-span-2 space-y-6">
          <InventoryTable items={items} isLoading={itemsLoading} />
        </div>

        {/* Right Column - Analytics and Alerts */}
        <div className="space-y-6">
          <LowStockAlerts items={items} isLoading={itemsLoading} />
          <ExpiringItems items={items} isLoading={itemsLoading} />
          <TopSellingItems stats={stats} isLoading={statsLoading} />
          <CategoryBreakdown stats={stats} isLoading={statsLoading} />
        </div>
      </div>

      {/* Add Item Dialog */}
      <AddItemDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}