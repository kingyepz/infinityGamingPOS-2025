
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_STAFF_PERFORMANCE, CURRENCY_SYMBOL } from '@/lib/constants';
import { Crown } from 'lucide-react';

export function StaffPerformance() {
  // Sort staff by revenue to find top performer
  const sortedStaff = [...MOCK_STAFF_PERFORMANCE].sort((a, b) => b.revenueToday - a.revenueToday);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Performance</CardTitle>
        <CardDescription>Today's revenue generated per staff member.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedStaff.map((staff, index) => (
            <div key={staff.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                 <AvatarImage src={`https://placehold.co/40x40.png`} alt={staff.name} data-ai-hint="staff avatar" />
                <AvatarFallback>{staff.initials}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{staff.name}</p>
                <p className="text-sm text-muted-foreground">{staff.sessions} sessions</p>
              </div>
              <div className="ml-auto font-medium text-right">
                {index === 0 && <Crown className="h-4 w-4 text-yellow-500 mb-1 ml-auto" />}
                <span>{CURRENCY_SYMBOL} {staff.revenueToday.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
