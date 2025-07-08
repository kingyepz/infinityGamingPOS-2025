
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import type { Session, CustomerOffer } from '@/types';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from '@/components/ui/separator';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { format } from 'date-fns';
import { Loader2, Split, Gift, Smartphone, AlertCircle, CheckCircle, Wallet, CreditCard } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export type Payer = 'primary' | 'secondary' | 'split';
type StkStatus = 'idle' | 'sending' | 'pending' | 'success' | 'error';
type PaymentMethod = 'cash' | 'mpesa-manual' | 'mpesa-stk';

const paymentFormSchema = z.object({
  paymentMethod: z.custom<PaymentMethod>(),
  mpesaReference: z.string().optional(),
  phoneNumber: z.string().optional(),
}).refine(data => {
  if (data.paymentMethod === 'mpesa-manual') {
    return !!data.mpesaReference && data.mpesaReference.trim().length > 3;
  }
  return true;
}, {
  message: "M-Pesa reference is required for manual entry.",
  path: ["mpesaReference"],
}).refine(data => {
    if (data.paymentMethod === 'mpesa-stk') {
        const phoneRegex = /^(?:254|0)?(7[0-9]{8})$/;
        return !!data.phoneNumber && phoneRegex.test(data.phoneNumber);
    }
    return true;
}, {
    message: "A valid Safaricom number (e.g., 0712345678) is required.",
    path: ["phoneNumber"],
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface EndSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onProcessPayment: (paidSession: Session, payer: Payer) => void;
  isProcessing: boolean;
}

const fetchActiveOffers = async (customerId: string): Promise<CustomerOffer[]> => {
    if (!customerId) return [];
    const supabase = createClient();
    const { data, error } = await supabase
        .from('customer_offers')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString());

    if (error) {
        console.error("Error fetching customer offers:", error);
        return []; 
    }
    return data;
}

export default function EndSessionDialog({ isOpen, onClose, session, onProcessPayment, isProcessing }: EndSessionDialogProps) {
  const [payer, setPayer] = useState<Payer>('primary');
  const [stkStatus, setStkStatus] = useState<StkStatus>('idle');
  const [stkError, setStkError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const hasTwoPlayers = !!session.secondary_customer_id;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: "cash",
      mpesaReference: "",
      phoneNumber: session.customerPhoneNumber || "",
    },
  });
  
  const paymentMethod = form.watch("paymentMethod");

  const { data: activeOffers, isLoading: isLoadingOffers } = useQuery({
    queryKey: ['activeOffers', session.customer_id],
    queryFn: () => fetchActiveOffers(session.customer_id),
    enabled: isOpen,
  });
  
  // Reset form and state when dialog opens or session changes
  useEffect(() => {
    if (isOpen) {
      form.reset({ 
        paymentMethod: "cash", 
        mpesaReference: "",
        phoneNumber: session.customerPhoneNumber || "",
      });
      setPayer('primary');
      setStkStatus('idle');
      setStkError(null);
    }
  }, [isOpen, session.id, form, session.customerPhoneNumber]);

  // STK Push polling logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (stkStatus === 'pending') {
      const startTime = Date.now();
      const poll = async () => {
        if (Date.now() - startTime > 60000) { // 1 minute timeout
          setStkStatus('error');
          setStkError('Payment timed out. The customer did not complete the transaction in time.');
          clearInterval(intervalId);
          return;
        }

        const supabase = createClient();
        const { data } = await supabase.from('sessions').select('payment_status, mpesa_reference').eq('id', session.id).single();
        if (data?.payment_status === 'paid') {
          setStkStatus('success');
          // Manually update the form with the reference from the DB
          form.setValue('mpesaReference', data.mpesa_reference || 'N/A');
          clearInterval(intervalId);
        }
      };
      intervalId = setInterval(poll, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(intervalId);
  }, [stkStatus, session.id, form]);


  const handleSubmit = (data: PaymentFormData) => {
    let finalPaymentMethod: 'cash' | 'mpesa' | 'mpesa-stk' = 'cash';
    if (data.paymentMethod === 'mpesa-manual') finalPaymentMethod = 'mpesa';
    if (data.paymentMethod === 'mpesa-stk') finalPaymentMethod = 'mpesa-stk';
    
    const paidSession: Session = {
      ...session,
      payment_status: 'paid',
      payment_method: finalPaymentMethod,
      mpesa_reference: data.mpesaReference?.trim(),
    };
    onProcessPayment(paidSession, payer);
  };
  
  const handleSendStkPush = async () => {
    const phoneNumber = form.getValues("phoneNumber");
    const validationResult = await form.trigger("phoneNumber");
    if (!validationResult) return;

    setStkStatus('sending');
    setStkError(null);
    
    try {
        const response = await fetch('/api/stk-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: session.amount_charged,
                phoneNumber: phoneNumber,
                sessionId: session.id
            }),
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to initiate STK Push.');
        }
        
        toast({ title: "Request Sent!", description: "A payment prompt has been sent to the customer's phone." });
        setStkStatus('pending');

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        setStkStatus('error');
        setStkError(message);
        toast({ title: "STK Push Failed", description: message, variant: "destructive" });
    }
  }

  const amountPerPlayer = session.amount_charged ? (session.amount_charged / 2).toFixed(2) : '0.00';
  const pointsPerPlayer = session.points_earned ? Math.floor(session.points_earned / 2) : 0;
  
  const isBusy = isProcessing || stkStatus === 'sending' || stkStatus === 'pending';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isBusy) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End Session & Process Payment</DialogTitle>
          <DialogDescription>
            Finalize session for {session.customerName}{hasTwoPlayers ? ` & ${session.secondaryCustomerName}` : ''} on {session.stationName}.
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingOffers && <Skeleton className="h-16 w-full" />}
        {activeOffers && activeOffers.length > 0 && (
          <Alert>
            <Gift className="h-4 w-4" />
            <AlertTitle className="font-bold">🎉 Birthday Offer Available!</AlertTitle>
            <AlertDescription>
              This customer has a <strong>{activeOffers[0].description}</strong>. Please apply the discount manually before confirming payment.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3 py-4 text-sm">
          <div className="flex justify-between"><span>Start Time:</span> <span>{format(new Date(session.start_time), 'p')}</span></div>
          {session.end_time && <div className="flex justify-between"><span>End Time:</span> <span>{format(new Date(session.end_time), 'p')}</span></div>}
          {session.session_type === 'per-hour' && session.duration_minutes != null && (
            <div className="flex justify-between"><span>Duration:</span> <span>{session.duration_minutes} minutes</span></div>
          )}
          <div className="flex justify-between"><span>Billing:</span> <span>{session.session_type === 'per-hour' ? `${CURRENCY_SYMBOL} ${session.rate}/hr` : `${CURRENCY_SYMBOL} ${session.rate} (fixed)`}</span></div>
          
          <Separator />
          
          <div className="flex justify-between font-semibold text-lg"><span>Amount Charged:</span> <span>{CURRENCY_SYMBOL} {session.amount_charged?.toFixed(2) || '0.00'}</span></div>
          
          <Separator />
          
          <div className="flex justify-between"><span>Points Earned:</span> <span className="font-medium text-green-500">{session.points_earned || 0} pts</span></div>
        </div>
        
        {hasTwoPlayers && (
            <>
                <div className="space-y-2">
                    <Label>Payment Arrangement</Label>
                    <RadioGroup value={payer} onValueChange={(value) => setPayer(value as Payer)} className="grid grid-cols-1 gap-2">
                        <Label htmlFor="pay-primary" className="flex items-center justify-between rounded-md border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary">
                            <span>{session.customerName} pays full amount</span>
                            <RadioGroupItem value="primary" id="pay-primary" />
                        </Label>
                        <Label htmlFor="pay-secondary" className="flex items-center justify-between rounded-md border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary">
                            <span>{session.secondaryCustomerName} pays full amount</span>
                            <RadioGroupItem value="secondary" id="pay-secondary" />
                        </Label>
                        <Label htmlFor="pay-split" className="flex items-center justify-between rounded-md border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary">
                            <span className="flex items-center">
                                <Split className="h-4 w-4 mr-2 text-muted-foreground" />
                                Split bill 50/50 ({CURRENCY_SYMBOL}{amountPerPlayer} & {pointsPerPlayer} pts each)
                            </span>
                            <RadioGroupItem value="split" id="pay-split" />
                        </Label>
                    </RadioGroup>
                </div>
                <Separator />
            </>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                   <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 gap-2"
                        disabled={isBusy}
                    >
                        <Label className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary">
                            <Wallet className="h-5 w-5 text-blue-500"/>
                            <span className="flex-1">Cash</span>
                            <RadioGroupItem value="cash" />
                        </Label>
                        <Label className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary">
                            <CreditCard className="h-5 w-5 text-green-500"/>
                            <span className="flex-1">M-Pesa (Manual Ref)</span>
                            <RadioGroupItem value="mpesa-manual" />
                        </Label>
                         <Label className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary">
                            <Smartphone className="h-5 w-5 text-green-600"/>
                             <span className="flex-1">M-Pesa Express (STK)</span>
                            <RadioGroupItem value="mpesa-stk" />
                        </Label>
                    </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {paymentMethod === 'mpesa-manual' && (
              <FormField
                control={form.control}
                name="mpesaReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>M-Pesa Reference Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. RKT123ABC45 (case-insensitive)" {...field} value={field.value || ''} disabled={isBusy} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {paymentMethod === 'mpesa-stk' && (
                <div className="space-y-4 rounded-md border bg-muted/50 p-4">
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Customer's M-Pesa Number</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. 0712345678" {...field} value={field.value || ''} disabled={isBusy} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="button" onClick={handleSendStkPush} disabled={isBusy} className="w-full">
                        {stkStatus === 'sending' && <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>}
                        {stkStatus === 'pending' && <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Waiting for Customer...</>}
                        {stkStatus === 'success' && <><CheckCircle className="mr-2 h-4 w-4" />Payment Received!</>}
                        {(stkStatus === 'idle' || stkStatus === 'error') && 'Send Payment Request'}
                    </Button>
                    {stkStatus === 'error' && (
                        <Alert variant="destructive" className="text-xs">
                           <AlertCircle className="h-4 w-4" />
                           <AlertTitle>Error</AlertTitle>
                           <AlertDescription>{stkError}</AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isBusy}>Cancel</Button>
              <Button type="submit" disabled={isBusy || (paymentMethod === 'mpesa-stk' && stkStatus !== 'success')}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
