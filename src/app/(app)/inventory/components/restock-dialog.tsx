"use client";

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { InventoryItem } from '@/types';

const restockSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  cost_price: z.coerce.number().min(0, 'Cost price must be non-negative').optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

type RestockFormData = z.infer<typeof restockSchema>;

interface RestockDialogProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export function RestockDialog({ item, onClose }: RestockDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RestockFormData>({
    resolver: zodResolver(restockSchema),
    defaultValues: {
      quantity: 1,
      cost_price: item?.cost_price || '',
      supplier: item?.supplier || '',
      notes: '',
    },
  });

  const restockMutation = useMutation({
    mutationFn: async (data: RestockFormData) => {
      if (!item) throw new Error('No item selected');
      
      const supabase = createClient();
      
      const { data: result, error } = await supabase.rpc('process_inventory_restock', {
        p_item_id: item.id,
        p_quantity: data.quantity,
        p_cost_price: data.cost_price || null,
        p_supplier: data.supplier || null,
        p_notes: data.notes || null,
        p_recorded_by: null, // TODO: Get current user ID
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Stock Updated",
          description: `Successfully added ${form.getValues('quantity')} units. New stock: ${result.new_stock}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to restock item",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to restock item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: RestockFormData) => {
    setIsSubmitting(true);
    try {
      await restockMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Restock Item
          </DialogTitle>
          <DialogDescription>
            Add stock to "{item.name}". Current stock: {item.stock_quantity} units
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity to Add *</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" placeholder="Enter quantity" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Price (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="Enter cost price per unit" 
                      {...field}
                      value={field.value === '' ? '' : field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter supplier name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any notes about this restock..." 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Restock
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}