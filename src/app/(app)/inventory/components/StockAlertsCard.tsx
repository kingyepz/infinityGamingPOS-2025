"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { LowStockItem } from '@/types';
import { CURRENCY_SYMBOL } from '@/lib/constants';

const fetchLowStockItems = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_low_stock_items');

  if (error) {
    console.error('Error fetching low stock items:', error);
    throw new Error(`Failed to fetch low stock items: ${error.message}`);
  }

  return data as LowStockItem[];
};

export function StockAlertsCard() {
  const { data: lowStockItems, isLoading } = useQuery({
    queryKey: ['lowStockItems'],
    queryFn: fetchLowStockItems,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Stock Alerts
          </CardTitle>
          <CardDescription>
            Items that need attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lowStockItems || lowStockItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            Stock Alerts
          </CardTitle>
          <CardDescription>
            Items that need attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-green-600">All Stock Levels Good</h3>
            <p className="text-muted-foreground">
              No items are currently below their low stock threshold.
            </p>
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
          Stock Alerts
        </CardTitle>
        <CardDescription>
          {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} need{lowStockItems.length === 1 ? 's' : ''} restocking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lowStockItems.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20"
            >
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  {item.category} • {CURRENCY_SYMBOL} {item.unit_price.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <Badge variant="destructive" className="mb-1">
                  {item.stock_quantity} left
                </Badge>
                <div className="text-xs text-muted-foreground">
                  Threshold: {item.low_stock_threshold}
                </div>
              </div>
            </div>
          ))}

          {lowStockItems.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="outline" size="sm">
                View All ({lowStockItems.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}