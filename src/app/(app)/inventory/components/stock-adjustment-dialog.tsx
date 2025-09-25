"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { InventoryItem } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CURRENCY_SYMBOL } from '@/lib/constants';

const stockAdjustmentSchema = z.object({
  transaction_type: z.enum(['restock', 'adjustment', 'expired'], {
    required_error: 'Please select a transaction type',
  }),
  quantity_change: z.coerce.number().refine((val) => val !== 0, {
    message: 'Quantity change cannot be zero',
  }),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

type StockAdjustmentValues = z.infer<typeof stockAdjustmentSchema>;

interface StockAdjustmentDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function StockAdjustmentDialog({ item, open, onOpenChange, onSuccess }: StockAdjustmentDialogProps) {
  const { toast } = useToast();

  const form = useForm<StockAdjustmentValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      transaction_type: 'restock',
      quantity_change: 0,
      notes: '',
    },
  });

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      form.reset({
        transaction_type: 'restock',
        quantity_change: 0,
        notes: '',
      });
    }
  }, [open, form]);

  const onSubmit = async (values: StockAdjustmentValues) => {
    if (!item) return;

    try {
      const supabase = createClient();

      // Use the update_inventory_stock function
      const { data, error } = await supabase.rpc('update_inventory_stock', {
        p_item_id: item.id,
        p_quantity_change: values.quantity_change,
        p_transaction_type: values.transaction_type,
        p_notes: values.notes || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; new_stock?: number };

      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      const actionText = values.quantity_change > 0 ? 'added to' : 'removed from';
      toast({
        title: 'Stock updated',
        description: `${Math.abs(values.quantity_change)} units ${actionText} ${item.name}. New stock: ${result.new_stock}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update stock. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const quantityChange = form.watch('quantity_change');
  const transactionType = form.watch('transaction_type');
  
  const newStock = item ? item.stock_quantity + (quantityChange || 0) : 0;
  const isValidStock = newStock >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            Update the stock quantity for {item?.name}
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Current Stock:</span>
              <Badge variant="outline">{item.stock_quantity} units</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Unit Price:</span>
              <span className="text-sm font-medium">
                {CURRENCY_SYMBOL} {item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {quantityChange !== 0 && (
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium">New Stock:</span>
                <Badge variant={isValidStock ? "default" : "destructive"}>
                  {newStock} units
                </Badge>
              </div>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transaction_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="restock">Restock (Add inventory)</SelectItem>
                      <SelectItem value="adjustment">Adjustment (Add/Remove)</SelectItem>
                      <SelectItem value="expired">Expired (Remove)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity_change"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Change</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder={transactionType === 'expired' ? '-10' : '10'}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    {transactionType === 'expired' 
                      ? 'Enter negative number to remove expired items'
                      : transactionType === 'restock'
                      ? 'Enter positive number to add stock'
                      : 'Enter positive number to add, negative to remove'
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional notes about this stock adjustment..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Optional description of the adjustment</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isValidStock && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm text-destructive font-medium">
                  Warning: This adjustment would result in negative stock ({newStock} units)
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting || !isValidStock}
              >
                {form.formState.isSubmitting ? 'Updating...' : 'Update Stock'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}