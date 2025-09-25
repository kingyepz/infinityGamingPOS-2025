"use client";

import React, { useState, useMemo } from 'react';
import { 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Package, 
  Star,
  AlertTriangle,
  Calendar,
  Plus,
  Minus
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryItem } from '@/types';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StockAdjustmentDialog } from './stock-adjustment-dialog';

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading: boolean;
  onEditItem: (item: InventoryItem) => void;
  onRefresh: () => void;
}

export function InventoryTable({ items, isLoading, onEditItem, onRefresh }: InventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const categories = ['Snack', 'Drink', 'Merchandise', 'Equipment', 'Voucher'];

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      const matchesStock = stockFilter === 'all' || 
                          (stockFilter === 'low' && item.stock_quantity <= 10) ||
                          (stockFilter === 'out' && item.stock_quantity === 0) ||
                          (stockFilter === 'normal' && item.stock_quantity > 10);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [items, searchQuery, categoryFilter, stockFilter]);

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: 'Item deleted',
        description: `${item.name} has been removed from inventory.`,
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity <= 5) {
      return <Badge variant="destructive">Low Stock</Badge>;
    } else if (quantity <= 10) {
      return <Badge variant="secondary">Low Stock</Badge>;
    }
    return <Badge variant="outline">In Stock</Badge>;
  };

  const getExpiryBadge = (expiryDate?: string | null) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysUntilExpiry <= 7) {
      return <Badge variant="destructive">Expires Soon</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge variant="secondary">Expires in {daysUntilExpiry}d</Badge>;
    }
    
    return <Badge variant="outline">Expires {expiry.toLocaleDateString()}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Manage your inventory items</CardDescription>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                {filteredItems.length} of {items.length} items
              </CardDescription>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No items found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{item.name}</p>
                          {item.supplier && (
                            <p className="text-sm text-muted-foreground">{item.supplier}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.stock_quantity}</span>
                          {getStockBadge(item.stock_quantity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {CURRENCY_SYMBOL} {item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          {item.cost_price && (
                            <p className="text-sm text-muted-foreground">
                              Cost: {CURRENCY_SYMBOL} {item.cost_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {CURRENCY_SYMBOL} {(item.stock_quantity * item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {item.is_promo_active && (
                            <Badge variant="default" className="w-fit">
                              <Star className="h-3 w-3 mr-1" />
                              Promo
                            </Badge>
                          )}
                          {item.is_redeemable && (
                            <Badge variant="secondary" className="w-fit">
                              {item.points_required} pts
                            </Badge>
                          )}
                          {item.is_vip_only && (
                            <Badge variant="outline" className="w-fit">VIP Only</Badge>
                          )}
                          {getExpiryBadge(item.expiry_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEditItem(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAdjustingItem(item)}>
                              <Package className="mr-2 h-4 w-4" />
                              Adjust Stock
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteItem(item)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Item
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        item={adjustingItem}
        open={!!adjustingItem}
        onOpenChange={(open) => !open && setAdjustingItem(null)}
        onSuccess={onRefresh}
      />
    </>
  );
}