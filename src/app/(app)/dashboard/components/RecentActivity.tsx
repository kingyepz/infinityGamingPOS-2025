
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CURRENCY_SYMBOL } from "@/lib/constants";

// Mock data for recent sales
const recentSales = [
  { name: 'Olivia Martin', email: 'olivia.martin@email.com', amount: 1999.00, avatar: 'OM' },
  { name: 'Jackson Lee', email: 'jackson.lee@email.com', amount: 39.00, avatar: 'JL' },
  { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', amount: 299.00, avatar: 'IN' },
  { name: 'William Kim', email: 'will@email.com', amount: 99.00, avatar: 'WK' },
  { name: 'Sofia Davis', email: 'sofia.davis@email.com', amount: 39.00, avatar: 'SD' },
];


export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          A log of the most recent game sessions and payments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {recentSales.map((sale, index) => (
          <div key={index} className="flex items-center">
             <Avatar className="h-9 w-9">
              <AvatarImage src={`https://placehold.co/40x40.png`} alt="Avatar" data-ai-hint="avatar person" />
              <AvatarFallback>{sale.avatar}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{sale.name}</p>
              <p className="text-sm text-muted-foreground">{sale.email}</p>
            </div>
            <div className="ml-auto font-medium">+{CURRENCY_SYMBOL} {sale.amount.toFixed(2)}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
