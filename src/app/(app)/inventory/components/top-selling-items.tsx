"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Package } from 'lucide-react';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import type { InventoryStats } from '@/types';

interface TopSellingItemsProps {
  stats?: InventoryStats;
  isLoading: boolean;
}

export function TopSellingItems({ stats, isLoading }: TopSellingItemsProps) {
  const topItems = stats?.top_selling_items || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Top Selling Items
          </CardTitle>
          <CardDescription>Loading top selling items...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted/50 animate-pulse rounded-md" />
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-muted/50 animate-pulse rounded" />
                    <div className="h-3 w-16 bg-muted/50 animate-pulse rounded" />
                  </div>
                </div>
                <div className="h-4 w-12 bg-muted/50 animate-pulse rounded" />
              </div>
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
          <TrendingUp className="h-5 w-5 text-green-500" />
          Top Selling Items
        </CardTitle>
        <CardDescription>
          Best performing items today
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topItems.length === 0 ? (
          <div className="text-center py-4">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No sales data for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topItems.map((item, index) => (
              <div key={item.item_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.item_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.quantity_sold} units sold
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {CURRENCY_SYMBOL}{item.revenue.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}