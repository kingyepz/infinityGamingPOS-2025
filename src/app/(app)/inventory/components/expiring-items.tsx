"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import type { InventoryItem } from '@/types';

interface ExpiringItemsProps {
  items?: InventoryItem[];
  isLoading: boolean;
}

export function ExpiringItems({ items, isLoading }: ExpiringItemsProps) {
  const expiringItems = items?.filter(item => {
    if (!item.expiry_date) return false;
    const expiryDate = new Date(item.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  }) || [];

  const getExpiryBadgeVariant = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 1) return 'destructive';
    if (daysUntilExpiry <= 3) return 'secondary';
    return 'default';
  };

  const getExpiryBadgeText = (daysUntilExpiry: number) => {
    if (daysUntilExpiry === 0) return 'Expires Today';
    if (daysUntilExpiry === 1) return 'Expires Tomorrow';
    return `${daysUntilExpiry} days`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-red-500" />
            Expiring Items
          </CardTitle>
          <CardDescription>Loading expiring items...</CardDescription>
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
          <Calendar className="h-5 w-5 text-red-500" />
          Expiring Items
          {expiringItems.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {expiringItems.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Items expiring within 7 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {expiringItems.length === 0 ? (
          <div className="text-center py-4">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No items expiring soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expiringItems.slice(0, 5).map((item) => {
              const expiryDate = new Date(item.expiry_date!);
              const today = new Date();
              const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-md">
                      <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {expiryDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getExpiryBadgeVariant(daysUntilExpiry)}>
                      {getExpiryBadgeText(daysUntilExpiry)}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.stock_quantity} units
                    </div>
                  </div>
                </div>
              );
            })}
            {expiringItems.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  +{expiringItems.length - 5} more items expiring soon
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}