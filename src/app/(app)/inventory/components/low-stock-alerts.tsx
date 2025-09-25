"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package } from 'lucide-react';
import type { InventoryItem } from '@/types';

interface LowStockAlertsProps {
  items?: InventoryItem[];
  isLoading: boolean;
}

export function LowStockAlerts({ items, isLoading }: LowStockAlertsProps) {
  const lowStockItems = items?.filter(item => item.stock_quantity < 5) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Low Stock Alerts
          </CardTitle>
          <CardDescription>Loading low stock items...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-12 w-full bg-muted/50 animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Low Stock Alerts
          {lowStockItems.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {lowStockItems.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Items with stock below 5 units
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lowStockItems.length === 0 ? (
          <div className="text-center py-4">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All items are well stocked!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-md">
                    <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600 dark:text-orange-400">
                    {item.stock_quantity}
                  </div>
                  <div className="text-xs text-muted-foreground">units</div>
                </div>
              </div>
            ))}
            {lowStockItems.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  +{lowStockItems.length - 5} more items need restocking
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}