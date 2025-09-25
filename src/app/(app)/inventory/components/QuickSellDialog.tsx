"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InventoryItem } from '@/types';
import { ShoppingCart, Star, Crown } from 'lucide-react';
import { CURRENCY_SYMBOL } from '@/lib/constants';

const formSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  payment_method: z.enum(['cash', 'mpesa', 'mpesa-stk', 'split', 'loyalty_points']),
  notes: z.string().max(500, 'Notes too long').optional(),
  customer_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface QuickSellDialogProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  sessionId?: string;
  customerId?: string;
}

export function QuickSellDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
  sessionId,
  customerId
}: QuickSellDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || '');
  const supabase = createClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      payment_method: 'cash',
      notes: '',
      customer_id: customerId || '',
    },
  });

  React.useEffect(() => {
    form.reset({
      quantity: 1,
      payment_method: 'cash',
      notes: '',
      customer_id: customerId || '',
    });
    setSelectedCustomerId(customerId || '');
  }, [item, customerId, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/inventory/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          quantity: data.quantity,
          sessionId,
          customerId: data.customer_id || selectedCustomerId,
          paymentMethod: data.payment_method,
          notes: data.notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process sale');
      }

      toast({
        title: 'Sale Successful',
        description: `Sold ${data.quantity} x ${item.name} for ${CURRENCY_SYMBOL} ${result.data.total_value.toFixed(2)}`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        title: 'Sale Failed',
        description: error instanceof Error ? error.message : 'Failed to process sale',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setSelectedCustomerId('');
    }
    onOpenChange(newOpen);
  };

  const canUseLoyaltyPoints = item.is_redeemable && item.points_required > 0;
  const isVipOnly = item.is_vip_only;
  const availableStock = item.stock_quantity;
  const maxQuantity = Math.min(availableStock, 99); // Reasonable limit

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Quick Sell - {item.name}
          </DialogTitle>
          <DialogDescription>
            Sell this inventory item quickly
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="text-sm">
              <div className="font-medium">Available Stock: {availableStock} units</div>
              <div className="text-muted-foreground">Unit Price: {CURRENCY_SYMBOL} {item.unit_price.toFixed(2)}</div>
            </div>
            <Badge variant="outline">{item.category}</Badge>
          </div>

          <div className="flex flex-wrap gap-1">
            {item.is_promo_active && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Promo Active
              </Badge>
            )}
            {isVipOnly && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                <Crown className="h-3 w-3 mr-1" />
                VIP Only
              </Badge>
            )}
            {canUseLoyaltyPoints && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Star className="h-3 w-3 mr-1" />
                {item.points_required} pts each
              </Badge>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max={maxQuantity}
                      {...field}
                      placeholder="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="mpesa-stk">M-Pesa STK Push</SelectItem>
                      <SelectItem value="split">Split Payment</SelectItem>
                      {canUseLoyaltyPoints && (
                        <SelectItem value="loyalty_points">Loyalty Points</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('payment_method') === 'loyalty_points' && canUseLoyaltyPoints && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="text-sm">
                  <div className="font-medium">Loyalty Points Required:</div>
                  <div className="text-blue-600 dark:text-blue-400">
                    {item.points_required * (form.watch('quantity') || 1)} points
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-sm">
                <div className="font-medium">
                  Total: {CURRENCY_SYMBOL} {
                    (item.unit_price * (form.watch('quantity') || 1)).toFixed(2)
                  }
                </div>
                <div className="text-muted-foreground">
                  {form.watch('quantity') || 1} × {CURRENCY_SYMBOL} {item.unit_price.toFixed(2)}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any notes about this sale..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Complete Sale'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}