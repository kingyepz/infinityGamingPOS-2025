"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Package, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { InventoryItem, InventoryStats } from '@/types';
import { InventoryTable } from './components/InventoryTable';
import { AddItemDialog } from './components/AddItemDialog';
import { EditItemDialog } from './components/EditItemDialog';
import { DeleteItemDialog } from './components/DeleteItemDialog';
import { StockAdjustmentDialog } from './components/StockAdjustmentDialog';
import { StockAlertsCard } from './components/StockAlertsCard';
import { CURRENCY_SYMBOL } from '@/lib/constants';

const fetchInventoryItems = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory items:', error);
    throw new Error(`Failed to fetch inventory items: ${error.message}`);
  }

  return data as InventoryItem[];
};

const fetchInventoryStats = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_inventory_stats');

  if (error) {
    console.error('Error fetching inventory stats:', error);
    throw new Error(`Failed to fetch inventory stats: ${error.message}`);
  }

  return data[0] as InventoryStats;
};

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);

  const { data: items, isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['inventoryItems', searchTerm, selectedCategory],
    queryFn: fetchInventoryItems,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['inventoryStats'],
    queryFn: fetchInventoryStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Filter items based on search and category
  const filteredItems = React.useMemo(() => {
    if (!items) return [];

    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    return filtered;
  }, [items, searchTerm, selectedCategory]);

  const getStockBadgeVariant = (stock: number, threshold: number) => {
    if (stock === 0) return 'destructive';
    if (stock <= threshold) return 'secondary';
    return 'default';
  };

  const getStockBadgeText = (stock: number, threshold: number) => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your gaming lounge inventory items, stock levels, and promotions
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_items ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Items in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {CURRENCY_SYMBOL} {stats?.total_value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Stock value at current prices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.low_stock_count ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Items below threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promo Items</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.promo_items_count ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Active promotions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters and Search */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription>
                  {filteredItems.length} of {items?.length ?? 0} items
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Snack">Snack</SelectItem>
                    <SelectItem value="Drink">Drink</SelectItem>
                    <SelectItem value="Merchandise">Merchandise</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Voucher">Voucher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <InventoryTable
              items={filteredItems}
              isLoading={itemsLoading}
              onEdit={setEditingItem}
              onDelete={setDeletingItem}
              onStockAdjust={setAdjustingItem}
              getStockBadgeVariant={getStockBadgeVariant}
              getStockBadgeText={getStockBadgeText}
            />
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <StockAlertsCard />
      </div>

      {/* Dialogs */}
      <AddItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={refetchItems}
      />

      <EditItemDialog
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSuccess={refetchItems}
      />

      <DeleteItemDialog
        item={deletingItem}
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        onSuccess={refetchItems}
      />

      <StockAdjustmentDialog
        item={adjustingItem}
        open={!!adjustingItem}
        onOpenChange={(open) => !open && setAdjustingItem(null)}
        onSuccess={refetchItems}
      />
    </div>
  );
}