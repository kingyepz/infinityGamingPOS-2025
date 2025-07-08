
"use client";

import type { Session } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, CreditCard, Wallet, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PaymentsTableProps {
  payments: Session[];
  onViewReceipt: (session: Session) => void;
  userRole: string | null;
  onVoid: (session: Session) => void;
}

const PaymentMethodIcon = ({ method }: { method: 'cash' | 'mpesa' | null | undefined }) => {
    if (method === 'mpesa') {
        return <CreditCard className="h-4 w-4 text-green-500" />;
    }
    return <Wallet className="h-4 w-4 text-blue-500" />;
}

export default function PaymentsTable({ payments, onViewReceipt, userRole, onVoid }: PaymentsTableProps) {
  if (!payments || payments.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No completed payments found.</p>;
  }

  return (
    <div className="rounded-lg border shadow-sm overflow-x-auto bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Date & Time</TableHead>
            <TableHead className="whitespace-nowrap">Customer(s)</TableHead>
            <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
            <TableHead className="whitespace-nowrap">Method</TableHead>
            <TableHead className="whitespace-nowrap">Station</TableHead>
            <TableHead className="whitespace-nowrap">Game</TableHead>
            <TableHead className="whitespace-nowrap">Recorded By</TableHead>
            <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium whitespace-nowrap">
                 {payment.end_time ? format(parseISO(payment.end_time), 'dd/MM/yyyy p') : 'N/A'}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {payment.customerName}
                {payment.secondaryCustomerName && (
                    <span className="text-muted-foreground"> & {payment.secondaryCustomerName}</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono whitespace-nowrap">{CURRENCY_SYMBOL} {payment.amount_charged?.toFixed(2)}</TableCell>
              <TableCell className="whitespace-nowrap">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <Badge variant="outline" className="flex items-center gap-2 capitalize">
                                <PaymentMethodIcon method={payment.payment_method} />
                                {payment.payment_method || 'N/A'}
                           </Badge>
                        </TooltipTrigger>
                        {payment.payment_method === 'mpesa' && payment.mpesa_reference && (
                            <TooltipContent>
                               <p>Ref: {payment.mpesa_reference}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="whitespace-nowrap">{payment.stationName}</TableCell>
              <TableCell className="whitespace-nowrap">{payment.game_name}</TableCell>
              <TableCell className="whitespace-nowrap">{payment.recorderName}</TableCell>
              <TableCell className="text-right space-x-2 whitespace-nowrap">
                <Button variant="outline" size="icon" onClick={() => onViewReceipt(payment)} aria-label={`View receipt for ${payment.customerName}`}>
                  <Eye className="h-4 w-4" />
                </Button>
                {userRole === 'admin' && (
                  <Button variant="destructive" size="icon" onClick={() => onVoid(payment)} aria-label={`Void payment for ${payment.customerName}`}>
                      <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
