"use client";

import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InventoryItem } from '@/types';
import { CURRENCY_SYMBOL } from '@/lib/constants';

interface StockAlertsProps {
  items: InventoryItem[];
}

export function StockAlerts({ items }: StockAlertsProps) {
  const outOfStockItems = items.filter(item => item.stock_quantity === 0);
  const lowStockItems = items.filter(item => item.stock_quantity > 0 && item.stock_quantity <= 5);
  const criticalStockItems = items.filter(item => item.stock_quantity > 5 && item.stock_quantity <= 10);

  const totalAlerts = outOfStockItems.length + lowStockItems.length + criticalStockItems.length;

  if (totalAlerts === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Package className="h-5 w-5" />
            Stock Status
          </CardTitle>
          <CardDescription>All items are well-stocked</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">No stock alerts at this time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Stock Alerts
        </CardTitle>
        <CardDescription>
          {totalAlerts} item{totalAlerts !== 1 ? 's' : ''} need{totalAlerts === 1 ? 's' : ''} attention
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Out of Stock */}
        {outOfStockItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="destructive">Out of Stock</Badge>
              <span className="text-sm text-muted-foreground">
                {outOfStockItems.length} item{outOfStockItems.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {outOfStockItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-destructive/5 rounded-md border border-destructive/20">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">0 units</p>
                    <p className="text-xs text-muted-foreground">
                      {CURRENCY_SYMBOL} {item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
              {outOfStockItems.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{outOfStockItems.length - 3} more items
                </p>
              )}
            </div>
          </div>
        )}

        {/* Low Stock (1-5 units) */}
        {lowStockItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="destructive">Critical Stock</Badge>
              <span className="text-sm text-muted-foreground">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {lowStockItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-destructive/5 rounded-md border border-destructive/20">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.stock_quantity} units</p>
                    <p className="text-xs text-muted-foreground">
                      {CURRENCY_SYMBOL} {item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
              {lowStockItems.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{lowStockItems.length - 3} more items
                </p>
              )}
            </div>
          </div>
        )}

        {/* Warning Stock (6-10 units) */}
        {criticalStockItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Low Stock</Badge>
              <span className="text-sm text-muted-foreground">
                {criticalStockItems.length} item{criticalStockItems.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {criticalStockItems.slice(0, 2).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-secondary/20 rounded-md border border-secondary/30">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.stock_quantity} units</p>
                    <p className="text-xs text-muted-foreground">
                      {CURRENCY_SYMBOL} {item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
              {criticalStockItems.length > 2 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{criticalStockItems.length - 2} more items
                </p>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <Button variant="outline" size="sm" className="w-full">
            View All Stock Alerts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}