
"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Session } from '@/types';
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
import { Loader2, Split } from 'lucide-react';
import { Label } from '@/components/ui/label';

export type Payer = 'primary' | 'secondary' | 'split';

const paymentFormSchema = z.object({
  paymentMethod: z.enum(['cash', 'mpesa'], { required_error: "Payment method is required." }),
  mpesaReference: z.string().optional(),
}).refine(data => {
  if (data.paymentMethod === 'mpesa') {
    return !!data.mpesaReference && data.mpesaReference.trim().length > 3;
  }
  return true;
}, {
  message: "MPesa reference must be valid for MPesa payments.",
  path: ["mpesaReference"],
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface EndSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onProcessPayment: (paidSession: Session, payer: Payer) => void;
  isProcessing: boolean;
}

export default function EndSessionDialog({ isOpen, onClose, session, onProcessPayment, isProcessing }: EndSessionDialogProps) {
  const [payer, setPayer] = useState<Payer>('primary');
  const hasTwoPlayers = !!session.secondary_customer_id;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: "cash",
      mpesaReference: "",
    },
  });
  
  const paymentMethod = form.watch("paymentMethod");

  React.useEffect(() => {
    if (isOpen) {
      form.reset({ paymentMethod: "cash", mpesaReference: "" });
      setPayer('primary');
    }
  }, [isOpen, form]);


  const handleSubmit = (data: PaymentFormData) => {
    const paidSession: Session = {
      ...session,
      payment_status: 'paid',
      payment_method: data.paymentMethod,
      mpesa_reference: data.paymentMethod === 'mpesa' ? data.mpesaReference?.trim() : undefined,
    };
    onProcessPayment(paidSession, payer);
  };

  const amountPerPlayer = session.amount_charged ? (session.amount_charged / 2).toFixed(2) : '0.00';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isProcessing) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End Session & Process Payment</DialogTitle>
          <DialogDescription>
            Finalize session for {session.customerName}{hasTwoPlayers ? ` & ${session.secondaryCustomerName}` : ''} on {session.stationName}.
          </DialogDescription>
        </DialogHeader>
        
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
                                Split bill 50/50 ({CURRENCY_SYMBOL}{amountPerPlayer} each)
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
                <FormItem className="space-y-2">
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                      disabled={isProcessing}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="cash" id="cash"/>
                        </FormControl>
                        <FormLabel htmlFor="cash" className="font-normal">Cash</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="mpesa" id="mpesa"/>
                        </FormControl>
                        <FormLabel htmlFor="mpesa" className="font-normal">MPesa</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {paymentMethod === 'mpesa' && (
              <FormField
                control={form.control}
                name="mpesaReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MPesa Reference Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. RKT123ABC45" {...field} value={field.value || ''} disabled={isProcessing} />
                    </FormControl>
                     {payer === 'split' && <p className="text-xs text-muted-foreground mt-1">Enter both reference codes separated by a comma if needed.</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
              <Button type="submit" disabled={isProcessing}>
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
