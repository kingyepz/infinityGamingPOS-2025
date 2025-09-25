"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  ArrowUp, 
  ArrowDown, 
  Package, 
  ShoppingCart, 
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryTransaction } from '@/types';
import { CURRENCY_SYMBOL } from '@/lib/constants';

interface TransactionHistoryProps {
  transactions: InventoryTransaction[];
  isLoading: boolean;
  showPagination?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function TransactionHistory({ transactions, isLoading, showPagination = false }: TransactionHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTransactions = showPagination 
    ? transactions.slice(startIndex, endIndex)
    : transactions;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="h-4 w-4 text-green-600" />;
      case 'restock':
        return <ArrowUp className="h-4 w-4 text-blue-600" />;
      case 'adjustment':
        return <Package className="h-4 w-4 text-yellow-600" />;
      case 'return':
        return <RotateCcw className="h-4 w-4 text-purple-600" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionBadge = (type: string, quantityChange: number) => {
    const isPositive = quantityChange > 0;
    
    switch (type) {
      case 'sale':
        return <Badge variant="default">Sale</Badge>;
      case 'restock':
        return <Badge variant="secondary">Restock</Badge>;
      case 'adjustment':
        return <Badge variant={isPositive ? "secondary" : "outline"}>
          {isPositive ? 'Add' : 'Remove'}
        </Badge>;
      case 'return':
        return <Badge variant="outline">Return</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getQuantityDisplay = (quantityChange: number) => {
    const isPositive = quantityChange > 0;
    const absQuantity = Math.abs(quantityChange);
    
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
        <span className="font-medium">{absQuantity}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <Skeleton className="h-4 w-[100px]" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Stock Change</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(transaction.transaction_type)}
                    {getTransactionBadge(transaction.transaction_type, transaction.quantity_change)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{transaction.item_name}</p>
                    {transaction.notes && (
                      <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getQuantityDisplay(transaction.quantity_change)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className="text-muted-foreground">{transaction.quantity_before}</span>
                    <span className="mx-1">→</span>
                    <span className="font-medium">{transaction.quantity_after}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {transaction.total_amount ? (
                    <span className="font-medium">
                      {CURRENCY_SYMBOL} {transaction.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                  {transaction.loyalty_points_used && transaction.loyalty_points_used > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {transaction.loyalty_points_used} points used
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{format(new Date(transaction.created_at), 'MMM dd, yyyy')}</div>
                    <div className="text-muted-foreground">
                      {format(new Date(transaction.created_at), 'HH:mm')}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {transaction.customer_name ? (
                    <span className="text-sm">{transaction.customer_name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                  {transaction.payment_method && (
                    <div className="text-xs text-muted-foreground capitalize">
                      {transaction.payment_method.replace('_', ' ')}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, transactions.length)} of {transactions.length} transactions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}