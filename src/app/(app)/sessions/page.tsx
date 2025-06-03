
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { GameSession, Customer, GameConsole } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import StartSessionDialog from './components/start-session-dialog';
import EndSessionDialog from './components/end-session-dialog';
import ReceiptDialog from './components/receipt-dialog';
import ActiveSessionCard from './components/active-session-card';
import { MOCK_GAME_CONSOLES, VAT_RATE, POINTS_PER_CURRENCY_UNIT } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { differenceInMinutes } from 'date-fns';

export default function SessionsPage() {
  const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]); // Mock customers
  const [consoles, setConsoles] = useState<GameConsole[]>(MOCK_GAME_CONSOLES);
  
  const [isStartSessionDialogOpen, setIsStartSessionDialogOpen] = useState(false);
  const [sessionToEnd, setSessionToEnd] = useState<GameSession | null>(null);
  const [sessionForReceipt, setSessionForReceipt] = useState<GameSession | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Mock initial customers for selection
    setCustomers([
      { id: 'cust1', name: 'John Doe', phone: '0712345678', email: 'john.doe@example.com', loyaltyPoints: 120, createdAt: new Date(), sessionHistory: [] },
      { id: 'cust2', name: 'Jane Smith', phone: '0723456789', email: 'jane.smith@example.com', loyaltyPoints: 75, createdAt: new Date(), sessionHistory: [] },
      { id: 'cust3', name: 'Alex Green', phone: '0734567890', email: 'alex.green@example.com', loyaltyPoints: 200, createdAt: new Date(), sessionHistory: [] },
    ]);
    // Mock one active session for demo
     const mockSession: GameSession = {
      id: `sess${Date.now()}`,
      customerId: 'cust1',
      customerName: 'John Doe',
      consoleId: 'ps5-1',
      consoleName: 'PlayStation 5 - Console 1',
      gameName: 'Spider-Man 2',
      startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      billingType: 'per-hour',
      rate: 200,
      paymentStatus: 'pending',
      createdAt: new Date(),
    };
    setActiveSessions([mockSession]);
    setConsoles(prevConsoles => prevConsoles.map(c => c.id === 'ps5-1' ? { ...c, status: 'in-use', currentGameSessionId: mockSession.id } : c));

  }, []);

  const handleStartSession = (data: Omit<GameSession, 'id' | 'startTime' | 'paymentStatus' | 'createdAt' | 'customerName' | 'consoleName' | 'endTime' | 'durationMinutes' | 'subtotalAmount' | 'vatAmount' | 'totalAmount' | 'paymentMethod' | 'mpesaReference' | 'pointsAwarded'> & { customerId: string; consoleId: string; }) => {
    const customer = customers.find(c => c.id === data.customerId);
    const gameConsole = consoles.find(c => c.id === data.consoleId);

    if (!customer || !gameConsole) {
      toast({ title: "Error", description: "Selected customer or console not found.", variant: "destructive" });
      return;
    }
    if (gameConsole.status !== 'available') {
        toast({ title: "Console Unavailable", description: `${gameConsole.name} is currently ${gameConsole.status}.`, variant: "destructive" });
        return;
    }


    const newSession: GameSession = {
      ...data,
      id: `sess${Date.now()}`,
      customerName: customer.name,
      consoleName: gameConsole.name,
      startTime: new Date(),
      paymentStatus: 'pending',
      createdAt: new Date(),
    };
    setActiveSessions(prev => [...prev, newSession]);
    setConsoles(prev => prev.map(c => c.id === data.consoleId ? { ...c, status: 'in-use', currentGameSessionId: newSession.id } : c));
    setIsStartSessionDialogOpen(false);
    toast({ title: "Session Started", description: `Session for ${customer.name} on ${gameConsole.name} has started.` });
  };

  const handleOpenEndSessionDialog = (session: GameSession) => {
    const endTime = new Date();
    let durationMinutes = 0;
    if (session.billingType === 'per-hour') {
      durationMinutes = differenceInMinutes(endTime, session.startTime);
      // Ensure minimum duration is respected if applicable, e.g., bill for at least 15/30 mins
      // For simplicity, we'll use Math.ceil for hourly blocks.
    }
    
    let subtotal = 0;
    if (session.billingType === 'per-hour' && session.rate) {
      // Example: Bill per full hour block.
      // If session is 65 mins and rate is 200/hr, subtotal is 2 * 200 = 400.
      // Or bill proportionally: (durationMinutes / 60) * session.rate
      // Let's stick to billing per hour block for simplicity as in original code
      subtotal = Math.max(1, Math.ceil(durationMinutes / 60)) * session.rate; // Ensure at least one hour is billed or minimum charge
    } else if (session.billingType === 'per-game' && session.rate) {
      subtotal = session.rate;
    }

    const vatAmount = subtotal * VAT_RATE;
    const totalAmount = subtotal + vatAmount;
    const pointsAwarded = Math.floor(subtotal * POINTS_PER_CURRENCY_UNIT);


    setSessionToEnd({ 
      ...session, 
      endTime, 
      durationMinutes,
      subtotalAmount: subtotal, 
      vatAmount, 
      totalAmount, 
      pointsAwarded 
    });
  };

  const handleProcessPayment = useCallback((paidSession: GameSession) => {
    setActiveSessions(prev => prev.filter(s => s.id !== paidSession.id));
    setConsoles(prev => prev.map(c => c.id === paidSession.consoleId ? { ...c, status: 'available', currentGameSessionId: undefined } : c));
    setCustomers(prev => prev.map(cust => 
      cust.id === paidSession.customerId 
      ? { ...cust, loyaltyPoints: (cust.loyaltyPoints || 0) + (paidSession.pointsAwarded || 0) } 
      : cust
    ));
    
    setSessionToEnd(null);
    setSessionForReceipt(paidSession); // Show receipt after payment
    toast({ title: "Payment Successful", description: `Payment for ${paidSession.customerName}'s session processed.` });
  }, [toast]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-headline font-semibold">Active Game Sessions</h2>
        <Button onClick={() => setIsStartSessionDialogOpen(true)} disabled={consoles.filter(c => c.status === 'available').length === 0}>
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
        <div className="text-center py-10">
          <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">No active game sessions.</p>
          <p className="text-sm text-muted-foreground">Click "Start New Session" to get started.</p>
        </div>
      )}

      <StartSessionDialog
        isOpen={isStartSessionDialogOpen}
        onClose={() => setIsStartSessionDialogOpen(false)}
        onSubmit={handleStartSession}
        customers={customers}
        consoles={consoles.filter(c => c.status === 'available')}
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

