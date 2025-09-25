"use client";

import React from 'react';
import { Package, DollarSign, AlertTriangle, Star, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryAnalytics } from '@/types';
import { CURRENCY_SYMBOL } from '@/lib/constants';

interface InventoryAnalyticsCardsProps {
  analytics?: InventoryAnalytics;
  isLoading: boolean;
}

export function InventoryAnalyticsCards({ analytics, isLoading }: InventoryAnalyticsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Items',
      value: analytics?.total_items?.toLocaleString() || '0',
      description: 'Items in inventory',
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Total Value',
      value: `${CURRENCY_SYMBOL} ${analytics?.total_value?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`,
      description: 'Current inventory value',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Low Stock Items',
      value: analytics?.low_stock_count?.toString() || '0',
      description: 'Need restocking',
      icon: AlertTriangle,
      color: 'text-red-600',
      badge: analytics?.low_stock_count ? (analytics.low_stock_count > 0 ? 'warning' : 'success') : undefined,
    },
    {
      title: 'Promo Items',
      value: analytics?.promo_items_count?.toString() || '0',
      description: 'Active promotions',
      icon: Star,
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {card.badge && (
                <Badge variant={card.badge === 'warning' ? 'destructive' : 'secondary'} className="text-xs">
                  {card.badge === 'warning' ? 'Alert' : 'Good'}
                </Badge>
              )}
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}