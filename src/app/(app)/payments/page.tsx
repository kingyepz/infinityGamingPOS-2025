
"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session, LoyaltyTransaction } from '@/types';
import { createClient } from '@/lib/supabase/client';
import PaymentsTable from './components/payments-table';
import ReceiptDialog from '@/app/(app)/sessions/components/receipt-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const fetchPayments = async (): Promise<Session[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        customer:customers!customer_id(full_name),
        secondary_customer:customers!secondary_customer_id(full_name),
        station:stations(name),
        game:games(name),
        recorder:users(full_name)
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
        recorderName: (s.recorder as any)?.full_name || 'N/A',
    }));
};


export default function PaymentsPage() {
  const [sessionForReceipt, setSessionForReceipt] = useState<Session | null>(null);
  const [sessionToVoid, setSessionToVoid] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: payments, isLoading, isError, error } = useQuery<Session[]>({
    queryKey: ['payments'],
    queryFn: fetchPayments,
  });
  
  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (userData) {
          setUserRole(userData.role);
        }
      }
    };
    fetchUserRole();
  }, []);

  const voidMutation = useMutation({
    mutationFn: async (session: Session) => {
        const supabase = createClient();
        
        // 1. Update session status to 'cancelled' and add a note
        const { error: sessionError } = await supabase
            .from('sessions')
            .update({ 
                payment_status: 'cancelled', 
                notes: `Voided by Admin on ${new Date().toISOString()}` 
            })
            .eq('id', session.id);
        if (sessionError) throw new Error(`Could not void session: ${sessionError.message}`);

        // 2. Find associated loyalty transactions for this session
        const { data: transactions, error: txError } = await supabase
            .from('loyalty_transactions')
            .select('id, customer_id, points')
            .eq('session_id', session.id)
            .eq('transaction_type', 'earn');
        if (txError) {
            console.warn(`Could not find loyalty transactions to reverse for session ${session.id}: ${txError.message}`);
            return session; // Proceed even if no points were awarded
        }
        
        // 3. Create reversal loyalty transactions
        if (transactions && transactions.length > 0) {
            const reversalTransactions: Omit<LoyaltyTransaction, 'id' | 'created_at'>[] = transactions.map(tx => ({
                customer_id: tx.customer_id,
                session_id: session.id,
                transaction_type: 'redeem' as const,
                points: -Math.abs(tx.points), // Ensure points are negative
                description: `Reversal for voided session ${session.id.slice(-6)}`,
            }));
            const { error: reversalError } = await supabase.from('loyalty_transactions').insert(reversalTransactions);
            if (reversalError) throw new Error(`Could not create reversal transaction: ${reversalError.message}`);
        }
        return session;
    },
    onSuccess: (voidedSession) => {
        toast({ title: "Transaction Voided", description: `Session for ${voidedSession.customerName} has been voided and loyalty points reversed.` });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['customers-loyalty'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        setSessionToVoid(null);
    },
    onError: (err: Error) => {
        toast({ title: "Error Voiding Transaction", description: err.message, variant: "destructive" });
        setSessionToVoid(null);
    }
  });

  const handleViewReceipt = (session: Session) => {
    setSessionForReceipt(session);
  };
  
  const handleVoidPayment = (session: Session) => {
    setSessionToVoid(session);
  };

  const confirmVoid = () => {
    if (sessionToVoid) {
      voidMutation.mutate(sessionToVoid);
    }
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
            <p className="text-sm text-muted-foreground">Browse all completed transactions. Admins can void payments.</p>
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
          userRole={userRole}
          onVoid={handleVoidPayment}
        />
      )}

      {sessionForReceipt && (
        <ReceiptDialog
          isOpen={!!sessionForReceipt}
          onClose={handleCloseReceipt}
          session={sessionForReceipt}
        />
      )}
      
      {sessionToVoid && (
        <AlertDialog open={!!sessionToVoid} onOpenChange={() => setSessionToVoid(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to void this transaction?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. It will mark the session as cancelled and reverse any loyalty points awarded. This is for correcting errors and should be used with caution.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSessionToVoid(null)} disabled={voidMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmVoid} className="bg-destructive hover:bg-destructive/90" disabled={voidMutation.isPending}>
                {voidMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Void
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
