"use client";

import { InventoryItem } from '../page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, RefreshCw, AlertTriangle, Star, Crown, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InventoryTableProps {
  items: InventoryItem[];
  onDelete: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onRestock: (item: InventoryItem) => void;
}

const getCategoryBadgeVariant = (category: string): string => {
  switch (category) {
    case 'Snack': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Drink': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Merchandise': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Equipment': return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'Voucher': return 'bg-green-100 text-green-800 border-green-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStockStatus = (quantity: number) => {
  if (quantity === 0) return { variant: 'destructive' as const, text: 'Out of Stock' };
  if (quantity <= 5) return { variant: 'outline' as const, text: 'Low Stock', className: 'text-orange-600 border-orange-600' };
  if (quantity <= 20) return { variant: 'secondary' as const, text: 'In Stock' };
  return { variant: 'default' as const, text: 'Well Stocked' };
};

export default function InventoryTable({ items, onDelete, onEdit, onRestock }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && item.stock_quantity <= 5) ||
                        (stockFilter === 'out' && item.stock_quantity === 0) ||
                        (stockFilter === 'in' && item.stock_quantity > 5);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  if (!items || items.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No inventory items found. Click 'Add Item' to begin.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-lg border">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
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
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in">In Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredItems.length} of {items.length} items
      </div>

      {/* Table */}
      <div className="rounded-lg border shadow-sm overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Name</TableHead>
              <TableHead className="whitespace-nowrap">Category</TableHead>
              <TableHead className="text-right whitespace-nowrap">Stock</TableHead>
              <TableHead className="text-right whitespace-nowrap">Unit Price</TableHead>
              <TableHead className="text-right whitespace-nowrap">Total Value</TableHead>
              <TableHead className="whitespace-nowrap">Features</TableHead>
              <TableHead className="whitespace-nowrap">Supplier</TableHead>
              <TableHead className="whitespace-nowrap">Expiry</TableHead>
              <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const stockStatus = getStockStatus(item.stock_quantity);
              const totalValue = item.stock_quantity * item.unit_price;
              const isExpiringSoon = item.expiry_date && 
                new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {item.name}
                      {isExpiringSoon && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" title="Expires within 30 days" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryBadgeVariant(item.category)}>
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-medium">{item.stock_quantity}</span>
                      <Badge 
                        variant={stockStatus.variant}
                        className={stockStatus.className}
                      >
                        {stockStatus.text}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {CURRENCY_SYMBOL} {item.unit_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {CURRENCY_SYMBOL} {totalValue.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {item.is_redeemable && (
                        <Star className="h-4 w-4 text-yellow-500" title={`${item.points_required} points`} />
                      )}
                      {item.is_vip_only && (
                        <Crown className="h-4 w-4 text-purple-500" title="VIP Only" />
                      )}
                      {item.is_promo_active && (
                        <Zap className="h-4 w-4 text-green-500" title="Promo Active" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {item.supplier || 'N/A'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {item.expiry_date ? (
                      <span className={cn(
                        isExpiringSoon && "text-orange-600 font-medium"
                      )}>
                        {format(new Date(item.expiry_date), 'dd/MM/yyyy')}
                      </span>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRestock(item)}
                        title="Restock"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item)}
                        className="text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredItems.length === 0 && searchTerm && (
        <p className="text-center text-muted-foreground py-8">
          No items found matching "{searchTerm}". Try adjusting your search or filters.
        </p>
      )}
    </div>
  );
}