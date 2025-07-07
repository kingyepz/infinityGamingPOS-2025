
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Tv, Gamepad2, Vr360 } from 'lucide-react';
import { CURRENCY_SYMBOL } from '@/lib/constants';

const salesData = [
  { name: 'Online Bookings', icon: Globe, sales: 2500, value: '196,241.68', bounce: '29.9%' },
  { name: 'PlayStation', icon: Gamepad2, sales: 3900, value: '373,955.56', bounce: '40.22%' },
  { name: 'Xbox', icon: Tv, sales: 1400, value: '162,075.74', bounce: '23.44%' },
  { name: 'VR Sessions', icon: Vr360, sales: 562, value: '122,351.46', bounce: '32.14%' },
];

export function SalesBySource() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Source</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground font-semibold uppercase">
            <div className="col-span-1">Source</div>
            <div className="text-right">Sales</div>
            <div className="text-right">Value</div>
            <div className="text-right">Bounce</div>
          </div>
          {salesData.map((item) => (
            <div key={item.name} className="grid grid-cols-4 gap-4 items-center text-sm">
              <div className="flex items-center gap-3 col-span-1">
                <div className="bg-secondary p-2 rounded-lg">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-right">{item.sales.toLocaleString()}</div>
              <div className="text-right">{CURRENCY_SYMBOL} {item.value}</div>
              <div className="text-right">{item.bounce}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
