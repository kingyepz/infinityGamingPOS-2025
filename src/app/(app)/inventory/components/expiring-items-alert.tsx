"use client";

import React from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CURRENCY_SYMBOL } from '@/lib/constants';

interface ExpiringItem {
  id: string;
  name: string;
  category: string;
  stock_quantity: number;
  expiry_date: string;
  days_until_expiry: number;
}

interface ExpiringItemsAlertProps {
  items: ExpiringItem[];
}

export function ExpiringItemsAlert({ items }: ExpiringItemsAlertProps) {
  const expiredItems = items.filter(item => item.days_until_expiry < 0);
  const expiringToday = items.filter(item => item.days_until_expiry === 0);
  const expiringSoon = items.filter(item => item.days_until_expiry > 0 && item.days_until_expiry <= 7);
  const expiringThisMonth = items.filter(item => item.days_until_expiry > 7 && item.days_until_expiry <= 30);

  const totalAlerts = expiredItems.length + expiringToday.length + expiringSoon.length;

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Calendar className="h-5 w-5" />
            Expiry Status
          </CardTitle>
          <CardDescription>No items have expiry dates set</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">No expiry tracking needed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalAlerts === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Calendar className="h-5 w-5" />
            Expiry Status
          </CardTitle>
          <CardDescription>All items are within safe expiry dates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              {expiringThisMonth.length} item{expiringThisMonth.length !== 1 ? 's' : ''} expiring this month
            </p>
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
          Expiry Alerts
        </CardTitle>
        <CardDescription>
          {totalAlerts} item{totalAlerts !== 1 ? 's' : ''} need{totalAlerts === 1 ? 's' : ''} immediate attention
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expired Items */}
        {expiredItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="destructive">Expired</Badge>
              <span className="text-sm text-muted-foreground">
                {expiredItems.length} item{expiredItems.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {expiredItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-destructive/5 rounded-md border border-destructive/20">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.stock_quantity} units</p>
                    <p className="text-xs text-destructive">
                      Expired {Math.abs(item.days_until_expiry)} day{Math.abs(item.days_until_expiry) !== 1 ? 's' : ''} ago
                    </p>
                  </div>
                </div>
              ))}
              {expiredItems.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{expiredItems.length - 3} more expired items
                </p>
              )}
            </div>
          </div>
        )}

        {/* Expiring Today */}
        {expiringToday.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="destructive">Expires Today</Badge>
              <span className="text-sm text-muted-foreground">
                {expiringToday.length} item{expiringToday.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {expiringToday.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-destructive/5 rounded-md border border-destructive/20">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.stock_quantity} units</p>
                    <p className="text-xs text-destructive">Expires today</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiring Soon (1-7 days) */}
        {expiringSoon.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Expires Soon</Badge>
              <span className="text-sm text-muted-foreground">
                {expiringSoon.length} item{expiringSoon.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {expiringSoon.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-secondary/20 rounded-md border border-secondary/30">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.stock_quantity} units</p>
                    <p className="text-xs text-yellow-600">
                      {item.days_until_expiry} day{item.days_until_expiry !== 1 ? 's' : ''} left
                    </p>
                  </div>
                </div>
              ))}
              {expiringSoon.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{expiringSoon.length - 3} more items
                </p>
              )}
            </div>
          </div>
        )}

        {/* This Month */}
        {expiringThisMonth.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              {expiringThisMonth.length} item{expiringThisMonth.length !== 1 ? 's' : ''} expiring this month
            </p>
          </div>
        )}

        <div className="pt-2 border-t">
          <Button variant="outline" size="sm" className="w-full">
            View All Expiring Items
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}