
"use client";

import type { LoyaltyTransaction } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, Award, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionHistoryTableProps {
  transactions: LoyaltyTransaction[];
}

const getTransactionIcon = (type: string) => {
    switch (type) {
        case 'earn': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
        case 'bonus': return <Gift className="h-4 w-4 text-yellow-500" />;
        case 'redeem': return <ArrowDownLeft className="h-4 w-4 text-red-500" />;
        default: return <Award className="h-4 w-4 text-muted-foreground" />;
    }
};

const getTransactionBadgeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
     switch (type) {
        case 'earn': return 'default';
        case 'bonus': return 'secondary';
        case 'redeem': return 'destructive';
        default: return 'outline';
    }
}

export default function TransactionHistoryTable({ transactions }: TransactionHistoryTableProps) {
  if (!transactions || transactions.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>A complete log of all loyalty point activities for this customer.</CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-center text-muted-foreground py-8">No loyalty transactions recorded yet.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>A complete log of all loyalty point activities for this customer.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right whitespace-nowrap">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap">{format(new Date(tx.created_at), 'dd/MM/yyyy p')}</TableCell>
                   <TableCell className="whitespace-nowrap">
                       <Badge variant={getTransactionBadgeVariant(tx.transaction_type)} className="capitalize flex items-center gap-1.5">
                           {getTransactionIcon(tx.transaction_type)}
                           {tx.transaction_type}
                       </Badge>
                   </TableCell>
                  <TableCell>{tx.description || 'N/A'}</TableCell>
                  <TableCell className={cn(
                      "text-right font-mono font-semibold",
                      tx.points > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {tx.points > 0 ? `+${tx.points}` : tx.points}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
