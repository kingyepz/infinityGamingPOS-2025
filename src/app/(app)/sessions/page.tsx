
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session, Customer, Station } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Gamepad2, Loader2 } from 'lucide-react';
import StartSessionDialog, { type SessionFormData } from './components/start-session-dialog';
import EndSessionDialog from './components/end-session-dialog';
import ReceiptDialog from './components/receipt-dialog';
import ActiveSessionCard from './components/active-session-card';
import { POINTS_PER_CURRENCY_UNIT } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { differenceInMinutes } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

// --- Data Fetching Functions ---
const fetchCustomers = async (): Promise<Customer[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.from('customers').select('*').order('full_name');
  if (error) throw new Error(error.message);
  return data;
};

const fetchStations = async (): Promise<Station[]> => {
  const supabase = createClient();
  // In a real app, you might join with sessions to get the status.
  // For now, we assume a 'status' column exists on the stations table.
  const { data, error } = await supabase.from('stations').select('*').order('name');
  if (error) {
    console.error("Error fetching stations, falling back to mock. DB Error:", error.message)
    // Fallback or re-throw as needed. For now, let's allow it to fail to be visible.
    throw new Error(`Could not fetch stations: ${error.message}. Please ensure a 'stations' table exists with RLS policies.`);
  }
  return data;
};

const fetchActiveSessions = async (): Promise<Session[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        customer:customers(full_name),
        station:stations(name)
      `)
      .eq('payment_status', 'pending');

    if (error) throw new Error(error.message);
    
    // Process data to match the Session type with nested customer/station names
    return data.map(s => ({
        ...s,
        id: s.id,
        customer_id: s.customer_id,
        station_id: s.station_id,
        game_name: s.game_name || 'Unknown Game',
        start_time: s.start_time,
        session_type: s.session_type as 'per-hour' | 'per-game',
        rate: s.rate || 0, // This should be handled better, maybe storing rate in sessions table
        payment_status: s.payment_status as 'pending' | 'paid' | 'cancelled',
        created_at: s.created_at,
        customerName: (s.customer as any)?.full_name || 'Unknown Customer',
        stationName: (s.station as any)?.name || 'Unknown Station',
    }));
};


export default function SessionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isStartSessionDialogOpen, setIsStartSessionDialogOpen] = useState(false);
  const [sessionToEnd, setSessionToEnd] = useState<Session | null>(null);
  const [sessionForReceipt, setSessionForReceipt] = useState<Session | null>(null);

  // --- React Query Hooks ---
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { data: stations, isLoading: isLoadingStations } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: fetchStations,
  });
  
  const { data: activeSessions, isLoading: isLoadingSessions, refetch: refetchActiveSessions } = useQuery<Session[]>({
      queryKey: ['activeSessions'],
      queryFn: fetchActiveSessions,
      refetchInterval: 30000, // Poll for new sessions every 30 seconds
  });
  
  const availableStations = stations?.filter(s => s.status === 'available') || [];


  // --- Mutations ---
  const startSessionMutation = useMutation({
    mutationFn: async (payload: Omit<Session, 'id' | 'created_at' | 'customerName' | 'stationName'>) => {
      const supabase = createClient();
      const { data, error } = await supabase.from('sessions').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: async (data, variables) => {
        // Also update the station's status to 'in-use'
        await createClient().from('stations').update({ status: 'in-use' }).eq('id', variables.station_id);
        
        queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
        queryClient.invalidateQueries({ queryKey: ['stations'] });
        setIsStartSessionDialogOpen(false);
        toast({ title: "Session Started", description: `A new session has started successfully.` });
    },
    onError: (err: Error) => {
        toast({ title: "Failed to Start Session", description: err.message, variant: "destructive" });
    }
  });

  const endSessionMutation = useMutation({
    mutationFn: async (paidSession: Session) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('sessions')
        .update({
          end_time: paidSession.end_time,
          duration_minutes: paidSession.duration_minutes,
          amount_charged: paidSession.amount_charged,
          points_earned: paidSession.points_earned,
          payment_status: 'paid',
          payment_method: paidSession.payment_method,
          mpesa_reference: paidSession.mpesa_reference,
        })
        .eq('id', paidSession.id);
      if (error) throw new Error(`Could not update session: ${error.message}`);
      return paidSession;
    },
    onSuccess: async (paidSession) => {
      // Free up the station
      await createClient().from('stations').update({ status: 'available' }).eq('id', paidSession.station_id);

      // Award loyalty points
      if (paidSession.points_earned && paidSession.points_earned > 0) {
        const { error: loyaltyError } = await createClient().rpc('increment_loyalty_points', {
            customer_id_param: paidSession.customer_id,
            points_to_add: paidSession.points_earned
        });
        if (loyaltyError) {
            toast({ title: "Loyalty Points Warning", description: `Could not update points: ${loyaltyError.message}`, variant: "destructive" });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      
      setSessionToEnd(null);
      setSessionForReceipt(paidSession);
      toast({ title: "Payment Successful", description: `Payment for ${paidSession.customerName}'s session processed.` });
    },
    onError: (err: Error) => {
        toast({ title: "Payment Failed", description: err.message, variant: "destructive" });
    }
  });


  // --- Event Handlers ---
  const handleStartSession = (formData: SessionFormData) => {
    const newSessionPayload = {
      customer_id: formData.customerId,
      station_id: formData.stationId,
      game_name: formData.gameName,
      session_type: formData.sessionType,
      start_time: new Date().toISOString(),
      rate: formData.rate,
      payment_status: 'pending' as const,
    };
    startSessionMutation.mutate(newSessionPayload);
  };

  const handleOpenEndSessionDialog = (session: Session) => {
    const endTime = new Date();
    const durationMinutes = differenceInMinutes(endTime, new Date(session.start_time));
    
    let amount_charged = 0;
    if (session.session_type === 'per-hour') {
      const hours = Math.max(1, Math.ceil(durationMinutes / 60));
      amount_charged = hours * session.rate;
    } else {
      amount_charged = session.rate;
    }

    const points_earned = Math.floor(amount_charged * POINTS_PER_CURRENCY_UNIT);

    setSessionToEnd({ 
      ...session, 
      end_time: endTime.toISOString(), 
      duration_minutes: durationMinutes,
      amount_charged: amount_charged,
      points_earned: points_earned
    });
  };

  const handleProcessPayment = (paidSession: Session) => {
    endSessionMutation.mutate(paidSession);
  };
  
  const isLoading = isLoadingCustomers || isLoadingStations || isLoadingSessions;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-headline font-semibold">Active Game Sessions</h2>
        <Button onClick={() => setIsStartSessionDialogOpen(true)} disabled={availableStations.length === 0 || isLoadingCustomers}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          Start New Session
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({length: 4}).map((_, i) => (
                <Card key={i} className="flex flex-col">
                    <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                    <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
            ))}
        </div>
      )}

      {!isLoading && activeSessions && activeSessions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activeSessions.map(session => (
            <ActiveSessionCard key={session.id} session={session} onEndSession={handleOpenEndSessionDialog} />
          ))}
        </div>
      ) : !isLoading && (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-lg bg-secondary/50 border-2 border-dashed border-border">
          <Gamepad2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg font-semibold">No Active Game Sessions</p>
          <p className="text-sm text-muted-foreground">Click "Start New Session" to get the fun started.</p>
        </div>
      )}

      <StartSessionDialog
        isOpen={isStartSessionDialogOpen}
        onClose={() => setIsStartSessionDialogOpen(false)}
        onSubmit={handleStartSession}
        customers={customers || []}
        stations={availableStations}
        isSubmitting={startSessionMutation.isPending}
      />

      {sessionToEnd && (
        <EndSessionDialog
          isOpen={!!sessionToEnd}
          onClose={() => setSessionToEnd(null)}
          session={sessionToEnd}
          onProcessPayment={handleProcessPayment}
          isProcessing={endSessionMutation.isPending}
        />
      )}

      {sessionForReceipt && (
        <ReceiptDialog
          isOpen={!!sessionForReceipt}
          onClose={() => setSessionForReceipt(null)}
          session={sessionForReceipt}
        />
      )}
    </div>
  );
}
