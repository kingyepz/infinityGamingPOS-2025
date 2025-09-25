"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Package } from 'lucide-react';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import type { InventoryStats } from '@/types';

interface CategoryBreakdownProps {
  stats?: InventoryStats;
  isLoading: boolean;
}

export function CategoryBreakdown({ stats, isLoading }: CategoryBreakdownProps) {
  const categories = stats?.category_breakdown || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Category Breakdown
          </CardTitle>
          <CardDescription>Loading category data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted/50 animate-pulse rounded-md" />
                  <div className="space-y-1">
                    <div className="h-4 w-20 bg-muted/50 animate-pulse rounded" />
                    <div className="h-3 w-12 bg-muted/50 animate-pulse rounded" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-muted/50 animate-pulse rounded" />
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
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Category Breakdown
        </CardTitle>
        <CardDescription>
          Inventory distribution by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-4">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No category data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{category.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {category.item_count} items
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {CURRENCY_SYMBOL}{category.stock_value.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    stock value
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