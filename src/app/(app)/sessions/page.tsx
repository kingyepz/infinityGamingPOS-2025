
"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session, Customer, Station, Game, LoyaltyTransaction } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Gamepad2, Loader2 } from 'lucide-react';
import StartSessionDialog, { type SessionFormData } from './components/start-session-dialog';
import EndSessionDialog, { type Payer } from './components/end-session-dialog';
import ReceiptDialog from './components/receipt-dialog';
import ActiveSessionCard from './components/active-session-card';
import { POINTS_PER_CURRENCY_UNIT } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { differenceInMinutes } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
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

// --- Data Fetching Functions ---
const fetchCustomers = async (): Promise<Customer[]> => {
  const supabase = createClient();
  
  const { data: customersData, error: customersError } = await supabase.from('customers').select('*').order('full_name');
  if (customersError) throw new Error(customersError.message);

  const { data: activeSessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('customer_id, secondary_customer_id')
    .eq('payment_status', 'pending');
  if (sessionsError) {
      console.warn("Could not fetch active sessions to determine customer status.");
      return customersData.map(c => ({...c, isActive: false }));
  }
  
  const activeCustomerIds = new Set<string>();
  activeSessions.forEach(s => {
    if (s.customer_id) activeCustomerIds.add(s.customer_id);
    if (s.secondary_customer_id) activeCustomerIds.add(s.secondary_customer_id);
  });

  return customersData.map(customer => ({
    ...customer,
    isActive: activeCustomerIds.has(customer.id),
  }));
};


const fetchStations = async (): Promise<Station[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.from('stations').select('*').order('name');
  if (error) {
    console.error("Error fetching stations, falling back to mock. DB Error:", error.message)
    throw new Error(`Could not fetch stations: ${error.message}. Please ensure a 'stations' table exists with RLS policies.`);
  }
  return data;
};

const fetchGames = async (): Promise<Game[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.from('games').select('*').order('name');
  if (error) throw new Error(error.message);
  return data;
};

const fetchActiveSessions = async (): Promise<Session[]> => {
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
      .eq('payment_status', 'pending');

    if (error) throw new Error(error.message);
    
    return data.map(s => ({
        ...s,
        id: s.id,
        customer_id: s.customer_id,
        secondary_customer_id: s.secondary_customer_id,
        station_id: s.station_id,
        game_id: s.game_id,
        start_time: s.start_time,
        session_type: s.session_type as 'per-hour' | 'per-game',
        rate: s.amount_charged || 0,
        payment_status: s.payment_status as 'pending' | 'paid' | 'cancelled',
        created_at: s.created_at,
        customerName: (s.customer as any)?.full_name || 'Unknown Customer',
        secondaryCustomerName: (s.secondary_customer as any)?.full_name || null,
        stationName: (s.station as any)?.name || 'Unknown Station',
        game_name: (s.game as any)?.name || 'Unknown Game',
    }));
};


export default function SessionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isStartSessionDialogOpen, setIsStartSessionDialogOpen] = useState(false);
  const [sessionToEnd, setSessionToEnd] = useState<Session | null>(null);
  const [sessionForReceipt, setSessionForReceipt] = useState<Session | null>(null);
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // --- React Query Hooks ---
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { data: stations, isLoading: isLoadingStations } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: fetchStations,
  });

  const { data: games, isLoading: isLoadingGames } = useQuery<Game[]>({
    queryKey: ['games'],
    queryFn: fetchGames,
  });
  
  const { data: activeSessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
      queryKey: ['activeSessions'],
      queryFn: fetchActiveSessions,
      refetchInterval: 30000,
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
  
  const availableStations = stations?.filter(s => s.status === 'available') || [];


  // --- Mutations ---
  const startSessionMutation = useMutation({
    mutationFn: async (payload: Partial<Session>) => {
      const supabase = createClient();
      const { data, error } = await supabase.from('sessions').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: async (data, variables) => {
        await createClient().from('stations').update({ status: 'in-use' }).eq('id', variables.station_id!);
        
        queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
        queryClient.invalidateQueries({ queryKey: ['stations'] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        setIsStartSessionDialogOpen(false);
        toast({ title: "Session Started", description: `A new session has started successfully.` });
    },
    onError: (err: Error) => {
        toast({ title: "Failed to Start Session", description: err.message, variant: "destructive" });
    }
  });

  const endSessionMutation = useMutation({
    mutationFn: async (params: { paidSession: Session; payer: Payer }) => {
        const { paidSession } = params;
        const supabase = createClient();

        // NEW: Secure, server-side check for duplicate MPesa reference via RPC
        if (paidSession.payment_method === 'mpesa' && paidSession.mpesa_reference) {
            const referencesToCheck = paidSession.mpesa_reference.split(',').map(ref => ref.trim().toUpperCase()).filter(Boolean);
            
            for (const ref of referencesToCheck) {
                if (!ref) continue;
                // Call the database function
                const { data: exists, error: rpcError } = await supabase.rpc('check_mpesa_ref_exists', { ref_code: ref });

                if (rpcError) {
                    // This could be because the function doesn't exist.
                    throw new Error(`Database error checking reference: ${rpcError.message}. Ensure the 'check_mpesa_ref_exists' function is created.`);
                }

                if (exists === true) {
                    throw new Error(`MPesa reference "${ref}" has already been used.`);
                }
            }
        }
    
        // If the check passes, proceed with updating the session
        const { error } = await supabase
            .from('sessions')
            .update({
                end_time: paidSession.end_time,
                duration_minutes: paidSession.duration_minutes,
                amount_charged: paidSession.amount_charged,
                points_earned: paidSession.points_earned,
                payment_status: 'paid',
                payment_method: paidSession.payment_method,
                // Normalize to uppercase and comma-space separated for consistency
                mpesa_reference: paidSession.mpesa_reference ? paidSession.mpesa_reference.split(',').map(ref => ref.trim().toUpperCase()).filter(Boolean).join(', ') : undefined,
            })
            .eq('id', paidSession.id);
        if (error) throw new Error(`Could not update session: ${error.message}`);
        return params;
    },
    onSuccess: async ({ paidSession, payer }) => {
      const supabase = createClient();
      await supabase.from('stations').update({ status: 'available' }).eq('id', paidSession.station_id);

      const totalPoints = paidSession.points_earned || 0;
      if (totalPoints > 0) {
        const transactions_to_add: Omit<LoyaltyTransaction, 'id' | 'created_at'>[] = [];
        const sessionDescription = `Points from session on ${paidSession.stationName}`;

        if (payer === 'primary' && paidSession.customer_id) {
          transactions_to_add.push({ customer_id: paidSession.customer_id, points: totalPoints, transaction_type: 'earn', description: sessionDescription, session_id: paidSession.id });
        } else if (payer === 'secondary' && paidSession.secondary_customer_id) {
          transactions_to_add.push({ customer_id: paidSession.secondary_customer_id, points: totalPoints, transaction_type: 'earn', description: sessionDescription, session_id: paidSession.id });
        } else if (payer === 'split') {
          const splitPoints = Math.floor(totalPoints / 2);
          if (paidSession.customer_id) {
            transactions_to_add.push({ customer_id: paidSession.customer_id, points: splitPoints, transaction_type: 'earn', description: sessionDescription, session_id: paidSession.id });
          }
          if (paidSession.secondary_customer_id) {
            transactions_to_add.push({ customer_id: paidSession.secondary_customer_id, points: totalPoints - splitPoints, transaction_type: 'earn', description: sessionDescription, session_id: paidSession.id });
          }
        }
        
        if (transactions_to_add.length > 0) {
          const { error: loyaltyError } = await supabase.from('loyalty_transactions').insert(transactions_to_add);
          if (loyaltyError) {
              toast({ title: "Loyalty Points Warning", description: `Could not record points transaction: ${loyaltyError.message}`, variant: "destructive" });
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['customers-loyalty'] });
      
      setSessionToEnd(null);
      setSessionForReceipt(paidSession);
      toast({ title: "Payment Successful", description: `Payment for ${paidSession.customerName}'s session processed.` });
    },
    onError: (err: Error) => {
        toast({ title: "Payment Failed", description: err.message, variant: "destructive" });
    }
  });

  const cancelSessionMutation = useMutation({
    mutationFn: async (session: Session) => {
        const supabase = createClient();
        const { error: sessionError } = await supabase
            .from('sessions')
            .update({ payment_status: 'cancelled', end_time: new Date().toISOString() })
            .eq('id', session.id);
        if (sessionError) throw new Error(`Could not cancel session: ${sessionError.message}`);

        const { error: stationError } = await supabase
            .from('stations')
            .update({ status: 'available' })
            .eq('id', session.station_id);
        if (stationError) {
            console.warn(`Failed to update station status for ${session.station_id}: ${stationError.message}`);
        }
        return session;
    },
    onSuccess: (cancelledSession) => {
        queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
        queryClient.invalidateQueries({ queryKey: ['stations'] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        setSessionToCancel(null);
        toast({ title: "Session Force-Cancelled", description: `Session on ${cancelledSession.stationName} has been cancelled.` });
    },
    onError: (err: Error) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
        setSessionToCancel(null);
    }
  });


  // --- Event Handlers ---
  const handleStartSession = async (formData: SessionFormData) => {
    const submittingToast = toast({
        title: "Validating Session...",
        description: "Checking customer availability.",
    });

    try {
        const supabase = createClient();
        const customerIdsToCheck = [formData.customerId];
        if (formData.secondaryCustomerId) {
            customerIdsToCheck.push(formData.secondaryCustomerId);
        }

        // Final real-time check to prevent double-booking.
        // This query now uses explicit aliases to avoid conflicts.
        const { data: activeCustomerSessions, error: checkError } = await supabase
            .from('sessions')
            .select('customer_id, secondary_customer_id, customer:customers!customer_id(full_name), secondary_customer:customers!secondary_customer_id(full_name)')
            .eq('payment_status', 'pending')
            .or(`customer_id.in.(${customerIdsToCheck.join(',')}),secondary_customer_id.in.(${customerIdsToCheck.join(',')})`);
        
        if (checkError) throw new Error(`DB Error: ${checkError.message}`);

        if (activeCustomerSessions && activeCustomerSessions.length > 0) {
            const activeCustomers = new Set<string>();
            activeCustomerSessions.forEach((session: any) => {
                if (session.customer && customerIdsToCheck.includes(session.customer_id)) {
                    activeCustomers.add(session.customer.full_name);
                }
                if (session.secondary_customer && customerIdsToCheck.includes(session.secondary_customer_id)) {
                    activeCustomers.add(session.secondary_customer.full_name);
                }
            });
            
            if (activeCustomers.size > 0) {
                const customerList = Array.from(activeCustomers).join(' & ');
                throw new Error(`${customerList} is already in an active session.`);
            }
        }

        // If validation passes, proceed.
        const newSessionPayload: Partial<Session> = {
            customer_id: formData.customerId,
            station_id: formData.stationId,
            game_id: formData.gameId,
            session_type: formData.sessionType,
            start_time: new Date().toISOString(),
            amount_charged: formData.rate,
            payment_status: 'pending' as const,
            secondary_customer_id: formData.secondaryCustomerId || null,
        };
        
        submittingToast.dismiss();
        startSessionMutation.mutate(newSessionPayload);

    } catch (err) {
        submittingToast.dismiss();
        toast({
            title: "Cannot Start Session",
            description: (err as Error).message,
            variant: "destructive",
        });
    }
  };

  const handleOpenEndSessionDialog = (session: Session) => {
    const endTime = new Date();
    const durationMinutes = differenceInMinutes(endTime, new Date(session.start_time));
    
    let finalAmountCharged = 0;
    if (session.session_type === 'per-hour') {
      const hours = Math.max(1, Math.ceil(durationMinutes / 60));
      finalAmountCharged = hours * (session.amount_charged || 0);
    } else {
      finalAmountCharged = session.amount_charged || 0;
    }

    const points_earned = Math.floor(finalAmountCharged * POINTS_PER_CURRENCY_UNIT);

    setSessionToEnd({ 
      ...session, 
      end_time: endTime.toISOString(), 
      duration_minutes: durationMinutes,
      amount_charged: finalAmountCharged,
      rate: session.amount_charged || 0,
      points_earned: points_earned
    });
  };

  const handleProcessPayment = (paidSession: Session, payer: Payer) => {
    endSessionMutation.mutate({ paidSession, payer });
  };
  
  const handleCancelSession = (session: Session) => {
    setSessionToCancel(session);
  };
  
  const isLoading = isLoadingCustomers || isLoadingStations || isLoadingSessions || isLoadingGames;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-headline font-semibold">Active Game Sessions</h2>
        <Button onClick={() => setIsStartSessionDialogOpen(true)} disabled={availableStations.length === 0 || isLoading}>
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
            <ActiveSessionCard 
                key={session.id} 
                session={session} 
                onEndSession={handleOpenEndSessionDialog} 
                onCancelSession={handleCancelSession}
                userRole={userRole}
                isEnding={sessionToEnd?.id === session.id && endSessionMutation.isPending}
            />
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
        games={games || []}
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
      
      {sessionToCancel && (
        <AlertDialog open={!!sessionToCancel} onOpenChange={() => setSessionToCancel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to force-end this session?</AlertDialogTitle>
              <AlertDialogDescription>
                This action is for stuck sessions and cannot be undone. It will mark the session as 'cancelled' and will not generate a bill or award loyalty points.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelSessionMutation.isPending}>Go Back</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => cancelSessionMutation.mutate(sessionToCancel)} 
                className="bg-destructive hover:bg-destructive/90" 
                disabled={cancelSessionMutation.isPending}
              >
                {cancelSessionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Cancellation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
