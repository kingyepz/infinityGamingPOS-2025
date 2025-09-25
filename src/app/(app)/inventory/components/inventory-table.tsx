"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditItemDialog } from './edit-item-dialog';
import { RestockDialog } from './restock-dialog';
import { DeleteItemDialog } from './delete-item-dialog';
import { Eye, MoreHorizontal, Package, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import type { InventoryItem } from '@/types';

interface InventoryTableProps {
  items?: InventoryItem[];
  isLoading: boolean;
}

export function InventoryTable({ items, isLoading }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [restockingItem, setRestockingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  // Filter items based on search and filters
  const filteredItems = items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && item.stock_quantity < 5) ||
                        (stockFilter === 'out' && item.stock_quantity === 0) ||
                        (stockFilter === 'in-stock' && item.stock_quantity > 0);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const getStockBadgeVariant = (quantity: number) => {
    if (quantity === 0) return 'destructive';
    if (quantity < 5) return 'secondary';
    return 'default';
  };

  const getStockBadgeText = (quantity: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity < 5) return 'Low Stock';
    return 'In Stock';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Loading your inventory items...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 w-full bg-muted/50 animate-pulse rounded-md" />
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
                Manage your inventory items, stock levels, and pricing
              </CardDescription>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Input
              placeholder="Search items or suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Snack">Snacks</SelectItem>
                <SelectItem value="Drink">Drinks</SelectItem>
                <SelectItem value="Merchandise">Merchandise</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Voucher">Vouchers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
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
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Stock Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No items found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.supplier && (
                              <div className="text-sm text-muted-foreground">{item.supplier}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.stock_quantity}</div>
                        {item.cost_price && (
                          <div className="text-sm text-muted-foreground">
                            Cost: {CURRENCY_SYMBOL}{item.cost_price.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{CURRENCY_SYMBOL}{item.unit_price.toFixed(2)}</div>
                        {item.expiry_date && (
                          <div className="text-sm text-muted-foreground">
                            Expires: {new Date(item.expiry_date).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{CURRENCY_SYMBOL}{item.stock_value?.toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={getStockBadgeVariant(item.stock_quantity)}>
                            {getStockBadgeText(item.stock_quantity)}
                          </Badge>
                          {item.is_promo_active && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Promo
                            </Badge>
                          )}
                          {item.is_redeemable && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {item.points_required} pts
                            </Badge>
                          )}
                          {item.is_vip_only && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              VIP Only
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingItem(item)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRestockingItem(item)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Restock
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingItem(item)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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

      {/* Dialogs */}
      <EditItemDialog 
        item={editingItem} 
        onClose={() => setEditingItem(null)} 
      />
      <RestockDialog 
        item={restockingItem} 
        onClose={() => setRestockingItem(null)} 
      />
      <DeleteItemDialog 
        item={deletingItem} 
        onClose={() => setDeletingItem(null)} 
      />
    </>
  );
}