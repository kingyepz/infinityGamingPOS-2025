
"use client";

import React from 'react';
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
  onProcessPayment: (paidSession: Session) => void;
}

export default function EndSessionDialog({ isOpen, onClose, session, onProcessPayment }: EndSessionDialogProps) {
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
      form.reset({
        paymentMethod: "cash",
        mpesaReference: "",
      });
    }
  }, [isOpen, form, session]);


  const handleSubmit = (data: PaymentFormData) => {
    const paidSession: Session = {
      ...session,
      payment_status: 'paid',
      payment_method: data.paymentMethod,
      mpesa_reference: data.paymentMethod === 'mpesa' ? data.mpesaReference?.trim() : undefined,
    };
    onProcessPayment(paidSession);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End Session & Process Payment</DialogTitle>
          <DialogDescription>
            Finalize session for {session.customerName} on {session.stationName} ({session.game_name}).
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
                      <Input placeholder="e.g. RKT123ABC45" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Confirm Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
