"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Package, AlertTriangle, TrendingUp, DollarSign, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { InventoryItem, InventoryTransaction, InventoryAnalytics } from '@/types';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { InventoryTable } from './components/inventory-table';
import { InventoryForm } from './components/inventory-form';
import { TransactionHistory } from './components/transaction-history';
import { StockAlerts } from './components/stock-alerts';
import { InventoryAnalyticsCards } from './components/inventory-analytics-cards';
import { ExpiringItemsAlert } from './components/expiring-items-alert';

// Fetch inventory items
const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(`Error fetching inventory: ${error.message}`);
  }

  return data || [];
};

// Fetch inventory analytics
const fetchInventoryAnalytics = async (): Promise<InventoryAnalytics> => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_inventory_analytics');

  if (error) {
    throw new Error(`Error fetching analytics: ${error.message}`);
  }

  return data;
};

// Fetch recent transactions
const fetchRecentTransactions = async (): Promise<InventoryTransaction[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select(`
      *,
      inventory_items(name),
      customers(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Error fetching transactions: ${error.message}`);
  }

  return (data || []).map(transaction => ({
    ...transaction,
    item_name: transaction.inventory_items?.name,
    customer_name: transaction.customers?.full_name
  }));
};

// Fetch low stock items
const fetchLowStockItems = async (): Promise<InventoryItem[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_low_stock_items', { p_threshold: 10 });

  if (error) {
    throw new Error(`Error fetching low stock items: ${error.message}`);
  }

  return data || [];
};

// Fetch expiring items
const fetchExpiringItems = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_expiring_items', { p_days_ahead: 30 });

  if (error) {
    throw new Error(`Error fetching expiring items: ${error.message}`);
  }

  return data || [];
};

export default function InventoryPage() {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Query hooks
  const { data: items = [], isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: fetchInventoryItems,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['inventory-analytics'],
    queryFn: fetchInventoryAnalytics,
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['inventory-transactions'],
    queryFn: fetchRecentTransactions,
    refetchInterval: 30000,
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['low-stock-items'],
    queryFn: fetchLowStockItems,
    refetchInterval: 60000,
  });

  const { data: expiringItems = [] } = useQuery({
    queryKey: ['expiring-items'],
    queryFn: fetchExpiringItems,
    refetchInterval: 60000,
  });

  const handleItemSaved = () => {
    refetchItems();
    setIsAddItemOpen(false);
    setEditingItem(null);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsAddItemOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground">
            Manage your gaming lounge inventory, track stock levels, and monitor sales
          </p>
        </div>
        <Button onClick={() => setIsAddItemOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Analytics Cards */}
      <InventoryAnalyticsCards analytics={analytics} isLoading={analyticsLoading} />

      {/* Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <StockAlerts items={lowStockItems} />
        <ExpiringItemsAlert items={expiringItems} />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventory Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold">{analytics?.total_items || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">
                      {CURRENCY_SYMBOL} {analytics?.total_value?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Low Stock</p>
                    <p className="text-2xl font-bold text-destructive">{analytics?.low_stock_count || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Promo Items</p>
                    <p className="text-2xl font-bold text-primary">{analytics?.promo_items_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Selling Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Selling Items (30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.top_selling_items?.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.total_sold} sold
                        </p>
                      </div>
                      <p className="font-semibold">
                        {CURRENCY_SYMBOL} {item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-4">
                      No sales data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest inventory movements</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionHistory 
                transactions={transactions.slice(0, 10)} 
                isLoading={transactionsLoading}
                showPagination={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <InventoryTable 
            items={items} 
            isLoading={itemsLoading} 
            onEditItem={handleEditItem}
            onRefresh={refetchItems}
          />
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Complete history of all inventory movements</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionHistory 
                transactions={transactions} 
                isLoading={transactionsLoading}
                showPagination={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>Comprehensive inventory insights and reporting</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Advanced analytics dashboard coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Item Dialog */}
      <InventoryForm
        open={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
        item={editingItem}
        onSaved={handleItemSaved}
      />
    </div>
  );
}