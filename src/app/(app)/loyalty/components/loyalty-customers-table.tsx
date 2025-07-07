
"use client";

import type { Customer } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface LoyaltyCustomersTableProps {
  customers: Customer[];
}

const getTierClassName = (tier: string = 'Bronze'): string => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return 'bg-sky-200 text-sky-800 border-sky-400 hover:bg-sky-200/80';
      case 'gold':
        return 'bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-400/80';
      case 'silver':
        return 'bg-slate-300 text-slate-800 border-slate-400 hover:bg-slate-300/80';
      case 'bronze':
        return 'bg-amber-600 text-white border-amber-700 hover:bg-amber-600/80';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
}

export default function LoyaltyCustomersTable({ customers }: LoyaltyCustomersTableProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Loyalty Leaderboard</CardTitle>
        <CardDescription>Top customers ranked by loyalty points.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">Rank</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer, index) => (
                <TableRow key={customer.id} className={index < 3 ? 'bg-muted/50' : ''}>
                  <TableCell className="font-medium text-center">
                    {index === 0 ? <Trophy className="h-5 w-5 mx-auto text-yellow-500" /> : index + 1}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{customer.full_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize", getTierClassName(customer.loyalty_tier))}>
                        {customer.loyalty_tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">{customer.loyalty_points.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
