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
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InventoryItem } from '@/types';
import { Plus, Minus } from 'lucide-react';

const formSchema = z.object({
  adjustment_type: z.enum(['restock', 'adjustment']),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.coerce.number().min(0.01, 'Unit price must be greater than 0').optional(),
  payment_method: z.enum(['cash', 'mpesa', 'mpesa-stk']),
  notes: z.string().max(500, 'Notes too long').optional(),
});

type FormData = z.infer<typeof formSchema>;

interface StockAdjustmentDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function StockAdjustmentDialog({ item, open, onOpenChange, onSuccess }: StockAdjustmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adjustment_type: 'restock',
      quantity: 1,
      unit_price: item?.unit_price || 0,
      payment_method: 'cash',
      notes: '',
    },
  });

  React.useEffect(() => {
    if (item) {
      form.reset({
        adjustment_type: 'restock',
        quantity: 1,
        unit_price: item.unit_price,
        payment_method: 'cash',
        notes: '',
      });
    }
  }, [item, form]);

  const onSubmit = async (data: FormData) => {
    if (!item) return;

    setIsSubmitting(true);

    try {
      // Get current user for performed_by field
      const { data: { user } } = await supabase.auth.getUser();

      // Calculate quantity change based on adjustment type
      const quantityChange = data.adjustment_type === 'restock' ? data.quantity : -data.quantity;

      // Call the stock update function
      const { data: result, error } = await supabase.rpc('update_inventory_stock', {
        p_item_id: item.id,
        p_quantity_change: quantityChange,
        p_transaction_type: data.adjustment_type,
        p_unit_price: data.unit_price,
        p_notes: data.notes || null,
        p_performed_by: user?.id || null,
        p_payment_method: data.payment_method,
      });

      if (error) {
        console.error('Error adjusting stock:', error);
        toast({
          title: 'Error',
          description: `Failed to adjust stock: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: `${item.name} stock has been ${data.adjustment_type === 'restock' ? 'restocked' : 'adjusted'}`,
        });
        form.reset();
        onOpenChange(false);
        onSuccess();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while adjusting stock',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {form.watch('adjustment_type') === 'restock' ? (
              <Plus className="h-5 w-5 text-green-600" />
            ) : (
              <Minus className="h-5 w-5 text-orange-600" />
            )}
            {form.watch('adjustment_type') === 'restock' ? 'Restock' : 'Adjust Stock'} - {item.name}
          </DialogTitle>
          <DialogDescription>
            {form.watch('adjustment_type') === 'restock'
              ? 'Add stock to this item'
              : 'Remove stock from this item'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 p-3 rounded-lg bg-muted/50">
          <div className="text-sm">
            <div className="font-medium">Current Stock: {item.stock_quantity} units</div>
            <div className="text-muted-foreground">Unit Price: KES {item.unit_price.toFixed(2)}</div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adjustment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="restock">Restock (Add Stock)</SelectItem>
                      <SelectItem value="adjustment">Adjustment (Remove Stock)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      {...field}
                      placeholder="Enter quantity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {form.watch('adjustment_type') === 'restock' ? 'Purchase Price per Unit' : 'Sale Price per Unit'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...field}
                      placeholder="0.00"
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any notes about this stock adjustment..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-sm">
                <div className="font-medium">
                  New Stock Level: {
                    item.stock_quantity +
                    (form.watch('adjustment_type') === 'restock' ? form.watch('quantity') || 0 : -(form.watch('quantity') || 0))
                  } units
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Confirm Adjustment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}