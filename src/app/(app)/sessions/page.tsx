
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Session, Customer, Station } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Gamepad2 } from 'lucide-react';
import StartSessionDialog, { type SessionFormData } from './components/start-session-dialog';
import EndSessionDialog from './components/end-session-dialog';
import ReceiptDialog from './components/receipt-dialog';
import ActiveSessionCard from './components/active-session-card';
import { MOCK_STATIONS, POINTS_PER_CURRENCY_UNIT } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { differenceInMinutes } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

export default function SessionsPage() {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stations, setStations] = useState<Station[]>(MOCK_STATIONS);
  
  const [isStartSessionDialogOpen, setIsStartSessionDialogOpen] = useState(false);
  const [sessionToEnd, setSessionToEnd] = useState<Session | null>(null);
  const [sessionForReceipt, setSessionForReceipt] = useState<Session | null>(null);

  const { toast } = useToast();
  const supabase = createClient();

  // Fetch initial data for customers and active sessions
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch customers
      const { data: customerData, error: customerError } = await supabase.from('customers').select('*');
      if (customerError) {
        toast({ title: "Error fetching customers", description: customerError.message, variant: "destructive" });
      } else {
        setCustomers(customerData || []);
      }

      // Fetch active sessions
      const { data: sessionData, error: sessionError } = await supabase.from('sessions').select('*').eq('payment_status', 'pending');
      if (sessionError) {
         toast({ title: "Error fetching active sessions", description: sessionError.message, variant: "destructive" });
      } else {
        const fetchedSessions: Session[] = (sessionData || []).map(s => ({
            ...s,
            id: s.id,
            customer_id: s.customer_id,
            station_id: s.station_id,
            game_name: s.game_name || 'Unknown Game',
            start_time: s.start_time,
            session_type: s.session_type,
            rate: s.amount_charged || 0, // Assuming rate might be stored in amount_charged for fixed sessions initially
            payment_status: s.payment_status,
            created_at: s.created_at,
            customerName: customers.find(c => c.id === s.customer_id)?.full_name || 'Unknown Customer',
            stationName: stations.find(st => st.id === s.station_id)?.name || 'Unknown Station'
        }));
        setActiveSessions(fetchedSessions);
        // Sync station statuses
        setStations(prevStations => prevStations.map(st => {
            const activeSession = fetchedSessions.find(s => s.station_id === st.id);
            return activeSession ? { ...st, status: 'in-use', currentSessionId: activeSession.id } : { ...st, status: 'available', currentSessionId: undefined };
        }));
      }
    };
    
    fetchInitialData();
  }, [supabase, toast]);


  const handleStartSession = async (formData: SessionFormData) => {
    const customer = customers.find(c => c.id === formData.customerId);
    const station = stations.find(s => s.id === formData.stationId);

    if (!customer || !station) {
      toast({ title: "Error", description: "Selected customer or station not found.", variant: "destructive" });
      return;
    }
    if (station.status !== 'available') {
        toast({ title: "Station Unavailable", description: `${station.name} is currently ${station.status}.`, variant: "destructive" });
        return;
    }
    
    const newSessionPayload = {
      customer_id: formData.customerId,
      station_id: formData.stationId,
      game_name: formData.gameName,
      session_type: formData.sessionType,
      start_time: new Date().toISOString(),
      // 'rate' is not a DB column, so we don't send it. amount_charged is set at the end.
    };

    const { data: insertedSession, error } = await supabase.from('sessions').insert(newSessionPayload).select().single();

    if (error) {
        toast({ title: "Failed to Start Session", description: error.message, variant: "destructive" });
        return;
    }

    const newSession: Session = {
      ...insertedSession,
      id: insertedSession.id,
      customerName: customer.full_name,
      stationName: station.name,
      rate: formData.rate, // Keep rate on client-side for calculation
      game_name: insertedSession.game_name,
      session_type: insertedSession.session_type,
      start_time: insertedSession.start_time,
      payment_status: 'pending',
      created_at: insertedSession.created_at,
      customer_id: insertedSession.customer_id
    };

    setActiveSessions(prev => [...prev, newSession]);
    setStations(prev => prev.map(s => s.id === formData.stationId ? { ...s, status: 'in-use', currentSessionId: newSession.id } : s));
    setIsStartSessionDialogOpen(false);
    toast({ title: "Session Started", description: `Session for ${customer.full_name} on ${station.name} has started.` });
  };

  const handleOpenEndSessionDialog = (session: Session) => {
    const endTime = new Date();
    const durationMinutes = differenceInMinutes(endTime, new Date(session.start_time));
    
    let amount_charged = 0;
    if (session.session_type === 'per-hour') {
      // Bill per hour, minimum of 1 hour.
      const hours = Math.max(1, Math.ceil(durationMinutes / 60));
      amount_charged = hours * session.rate;
    } else { // 'per-game'
      amount_charged = session.rate; // Fixed rate
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

  const handleProcessPayment = useCallback(async (paidSession: Session) => {
    if (!paidSession.end_time || paidSession.amount_charged == null) {
      toast({title: "Error", description: "Cannot process payment without end time and amount.", variant: "destructive"});
      return;
    }

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

    if (error) {
        toast({ title: "Payment Failed", description: `Could not update session: ${error.message}`, variant: "destructive" });
        return;
    }

    // Also update customer's loyalty points
    const { error: loyaltyError } = await supabase.rpc('increment_loyalty_points', {
      customer_id_param: paidSession.customer_id,
      points_to_add: paidSession.points_earned || 0
    });

     if (loyaltyError) {
        // Log the error but don't block the user flow, as the main payment succeeded.
        toast({ title: "Loyalty Points Warning", description: `Could not update points: ${loyaltyError.message}`, variant: "destructive" });
    }


    setActiveSessions(prev => prev.filter(s => s.id !== paidSession.id));
    setStations(prev => prev.map(s => s.id === paidSession.station_id ? { ...s, status: 'available', currentSessionId: undefined } : s));
    setCustomers(prev => prev.map(cust => 
      cust.id === paidSession.customer_id 
      ? { ...cust, loyalty_points: (cust.loyalty_points || 0) + (paidSession.points_earned || 0) } 
      : cust
    ));
    
    setSessionToEnd(null);
    setSessionForReceipt(paidSession); // Show receipt after payment
    toast({ title: "Payment Successful", description: `Payment for ${paidSession.customerName}'s session processed.` });
  }, [supabase, toast]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-headline font-semibold">Active Game Sessions</h2>
        <Button onClick={() => setIsStartSessionDialogOpen(true)} disabled={stations.filter(c => c.status === 'available').length === 0}>
          <PlusCircle className="mr-2 h-4 w-4" /> Start New Session
        </Button>
      </div>

      {activeSessions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activeSessions.map(session => (
            <ActiveSessionCard key={session.id} session={session} onEndSession={handleOpenEndSessionDialog} />
          ))}
        </div>
      ) : (
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
        customers={customers}
        stations={stations.filter(s => s.status === 'available')}
      />

      {sessionToEnd && (
        <EndSessionDialog
          isOpen={!!sessionToEnd}
          onClose={() => setSessionToEnd(null)}
          session={sessionToEnd}
          onProcessPayment={handleProcessPayment}
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
