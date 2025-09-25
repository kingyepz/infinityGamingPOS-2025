"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Package, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InventoryForm, { type InventoryFormData } from './components/inventory-form';
import InventoryTable from './components/inventory-table';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { CURRENCY_SYMBOL } from '@/lib/constants';

// Define inventory item type
export interface InventoryItem {
  id: string;
  name: string;
  category: 'Snack' | 'Drink' | 'Merchandise' | 'Equipment' | 'Voucher';
  stock_quantity: number;
  unit_price: number;
  cost_price?: number;
  supplier?: string;
  expiry_date?: string;
  is_redeemable: boolean;
  points_required: number;
  is_vip_only: boolean;
  is_promo_active: boolean;
  created_at: string;
  updated_at: string;
}

// Define functions to interact with Supabase
const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchInventoryStats = async () => {
  const supabase = createClient();
  
  // Get basic inventory stats
  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('stock_quantity, unit_price, cost_price');
    
  if (error) throw new Error(error.message);
  
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.stock_quantity * item.unit_price), 0);
  const lowStockItems = items.filter(item => item.stock_quantity <= 5).length;
  const totalCost = items.reduce((sum, item) => sum + (item.stock_quantity * (item.cost_price || 0)), 0);
  
  return {
    totalItems,
    totalValue,
    lowStockItems,
    totalCost,
    profitMargin: totalValue > 0 ? ((totalValue - totalCost) / totalValue * 100).toFixed(1) : '0'
  };
};

const addInventoryItem = async (item: InventoryFormData) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([item])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const updateInventoryItem = async ({ id, ...item }: InventoryFormData & { id: string }) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('inventory_items')
    .update({ ...item, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const deleteInventoryItem = async (itemId: string) => {
  const supabase = createClient();
  
  const { error, count } = await supabase
    .from('inventory_items')
    .delete({ count: 'exact' })
    .eq('id', itemId);

  if (error) throw new Error(error.message);
  if (count === 0) {
    throw new Error("Deletion failed. The item may not exist or you may not have permission to delete it.");
  }
};

const restockItem = async (itemId: string, quantity: number, notes?: string) => {
  const supabase = createClient();
  
  // Add restock transaction
  const { error } = await supabase
    .from('inventory_transactions')
    .insert([{
      item_id: itemId,
      transaction_type: 'restock',
      quantity: quantity,
      notes: notes || 'Manual restock'
    }]);

  if (error) throw new Error(error.message);
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [restockingItem, setRestockingItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(0);

  const { data: items, isLoading: itemsLoading, isError: itemsError, error: itemsErrorMsg } = useQuery<InventoryItem[]>({
    queryKey: ['inventory-items'],
    queryFn: fetchInventoryItems,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: fetchInventoryStats,
    refetchInterval: 30000,
  });

  const addMutation = useMutation({
    mutationFn: addInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({ title: "Item Added", description: "Inventory item has been added successfully." });
      setIsAddFormOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({ title: "Item Updated", description: "Inventory item has been updated successfully." });
      setEditingItem(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({ title: "Item Deleted", description: `${itemToDelete?.name} has been removed from inventory.` });
      setItemToDelete(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setItemToDelete(null);
    }
  });

  const restockMutation = useMutation({
    mutationFn: ({ itemId, quantity, notes }: { itemId: string; quantity: number; notes?: string }) =>
      restockItem(itemId, quantity, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({ title: "Item Restocked", description: `${restockingItem?.name} has been restocked successfully.` });
      setRestockingItem(null);
      setRestockQuantity(0);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const handleDeleteItem = (item: InventoryItem) => {
    setItemToDelete(item);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
  };

  const handleRestock = (item: InventoryItem) => {
    setRestockingItem(item);
    setRestockQuantity(10); // Default restock quantity
  };

  const confirmRestock = () => {
    if (restockingItem && restockQuantity > 0) {
      restockMutation.mutate({
        itemId: restockingItem.id,
        quantity: restockQuantity,
        notes: `Manual restock - ${restockQuantity} units added`
      });
    }
  };

  const handleFormSubmit = (formData: InventoryFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-headline font-semibold">Inventory Management</h2>
        <Dialog open={isAddFormOpen || !!editingItem} onOpenChange={(open) => {
          if (addMutation.isPending || updateMutation.isPending) return;
          setIsAddFormOpen(open);
          if (!open) setEditingItem(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            </DialogHeader>
            <InventoryForm 
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsAddFormOpen(false);
                setEditingItem(null);
              }}
              isSubmitting={addMutation.isPending || updateMutation.isPending}
              initialData={editingItem || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Items"
          value={stats?.totalItems?.toString() ?? '0'}
          icon={Package}
          description="Items in inventory"
          isLoading={statsLoading}
        />
        <StatCard
          title="Inventory Value"
          value={`${CURRENCY_SYMBOL} ${stats?.totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '0.00'}`}
          icon={TrendingUp}
          description="Total retail value"
          isLoading={statsLoading}
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockItems?.toString() ?? '0'}
          icon={AlertTriangle}
          description="Items with ≤5 units"
          isLoading={statsLoading}
        />
        <StatCard
          title="Profit Margin"
          value={`${stats?.profitMargin ?? '0'}%`}
          icon={TrendingUp}
          description="Overall profit margin"
          isLoading={statsLoading}
        />
      </div>

      {itemsLoading && (
        <div className="rounded-lg border shadow-sm bg-card p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/6" />
          </div>
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )}

      {itemsError && <p className="text-center text-destructive py-8">Error loading inventory: {itemsErrorMsg?.message}</p>}

      {!itemsLoading && !itemsError && (
        <InventoryTable 
          items={items || []} 
          onDelete={handleDeleteItem}
          onEdit={handleEditItem}
          onRestock={handleRestock}
        />
      )}

      {/* Delete confirmation dialog */}
      {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete {itemToDelete.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the inventory item and all associated transaction history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Restock dialog */}
      {restockingItem && (
        <AlertDialog open={!!restockingItem} onOpenChange={() => setRestockingItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restock {restockingItem.name}</AlertDialogTitle>
              <AlertDialogDescription>
                Current stock: {restockingItem.stock_quantity} units. How many units would you like to add?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="p-4">
              <input
                type="number"
                min="1"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                className="w-full p-2 border rounded"
                placeholder="Quantity to add"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRestockingItem(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRestock} disabled={restockMutation.isPending || restockQuantity <= 0}>
                {restockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <RefreshCw className="mr-2 h-4 w-4" />
                Restock
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}