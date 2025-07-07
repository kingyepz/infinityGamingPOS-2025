
"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@/types';
import { createClient } from '@/lib/supabase/client';
import PaymentsTable from './components/payments-table';
import ReceiptDialog from '@/app/(app)/sessions/components/receipt-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard } from 'lucide-react';

const fetchPayments = async (): Promise<Session[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        customer:customers!customer_id(full_name),
        secondary_customer:customers!secondary_customer_id(full_name),
        station:stations(name),
        game:games(name)
      `)
      .eq('payment_status', 'paid')
      .order('end_time', { ascending: false });

    if (error) {
        console.error("Error fetching payments:", error);
        throw new Error(error.message);
    }
    
    return data.map(s => ({
        ...s,
        id: s.id,
        customer_id: s.customer_id,
        secondary_customer_id: s.secondary_customer_id,
        station_id: s.station_id,
        game_id: s.game_id,
        start_time: s.start_time,
        session_type: s.session_type as 'per-hour' | 'per-game',
        rate: s.amount_charged || 0, // In this context, rate is less important than final amount
        payment_status: s.payment_status as 'paid',
        created_at: s.created_at,
        customerName: (s.customer as any)?.full_name || 'Unknown Customer',
        secondaryCustomerName: (s.secondary_customer as any)?.full_name || null,
        stationName: (s.station as any)?.name || 'Unknown Station',
        game_name: (s.game as any)?.name || 'Unknown Game',
    }));
};


export default function PaymentsPage() {
  const [sessionForReceipt, setSessionForReceipt] = useState<Session | null>(null);

  const { data: payments, isLoading, isError, error } = useQuery<Session[]>({
    queryKey: ['payments'],
    queryFn: fetchPayments,
  });

  const handleViewReceipt = (session: Session) => {
    setSessionForReceipt(session);
  };
  
  const handleCloseReceipt = () => {
    setSessionForReceipt(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <CreditCard className="h-8 w-8 text-primary" />
        <div>
            <h2 className="text-2xl font-headline font-semibold">Payment History</h2>
            <p className="text-sm text-muted-foreground">Browse all completed transactions.</p>
        </div>
      </div>

      {isLoading && (
         <div className="rounded-lg border shadow-sm bg-card p-4 space-y-3">
             <div className="flex justify-between items-center gap-4">
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="h-5 w-1/12" />
                <Skeleton className="h-5 w-1/12" />
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="h-5 w-1/12" />
             </div>
             {Array.from({length: 8}).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-full" />
                </div>
             ))}
         </div>
      )}

      {isError && <p className="text-center text-destructive py-8">Error loading payments: {error.message}</p>}

      {!isLoading && !isError && (
        <PaymentsTable 
          payments={payments || []} 
          onViewReceipt={handleViewReceipt}
        />
      )}

      {sessionForReceipt && (
        <ReceiptDialog
          isOpen={!!sessionForReceipt}
          onClose={handleCloseReceipt}
          session={sessionForReceipt}
        />
      )}
    </div>
  );
}
