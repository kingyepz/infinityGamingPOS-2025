"use client";

import React, { useState } from 'react';
import { Edit, Trash2, Package, Star, Crown, Percent, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InventoryItem } from '@/types';
import { CURRENCY_SYMBOL } from '@/lib/constants';

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onStockAdjust: (item: InventoryItem) => void;
  getStockBadgeVariant: (stock: number, threshold: number) => string;
  getStockBadgeText: (stock: number, threshold: number) => string;
}

export function InventoryTable({
  items,
  isLoading,
  onEdit,
  onDelete,
  onStockAdjust,
  getStockBadgeVariant,
  getStockBadgeText,
}: InventoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No inventory items found</h3>
        <p className="text-muted-foreground mb-4">
          Get started by adding your first inventory item.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    {item.supplier && (
                      <div className="text-sm text-muted-foreground">
                        Supplier: {item.supplier}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{item.category}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStockBadgeVariant(item.stock_quantity, item.low_stock_threshold)}>
                  {getStockBadgeText(item.stock_quantity, item.low_stock_threshold)}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">
                  {item.stock_quantity} units
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {CURRENCY_SYMBOL} {item.unit_price.toFixed(2)}
                </div>
                {item.cost_price && (
                  <div className="text-sm text-muted-foreground">
                    Cost: {CURRENCY_SYMBOL} {item.cost_price.toFixed(2)}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {item.is_promo_active && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <Percent className="h-3 w-3 mr-1" />
                      Promo
                    </Badge>
                  )}
                  {item.is_vip_only && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      <Crown className="h-3 w-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                  {item.is_redeemable && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      <Star className="h-3 w-3 mr-1" />
                      {item.points_required} pts
                    </Badge>
                  )}
                  {item.expiry_date && (
                    <Badge variant="outline" className="text-xs">
                      Expires: {new Date(item.expiry_date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStockAdjust(item)}
                    title="Adjust Stock"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(item)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, items.length)} of {items.length} items
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}