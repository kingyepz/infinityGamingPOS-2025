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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { InventoryItem } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

const inventoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  category: z.enum(['Snack', 'Drink', 'Merchandise', 'Equipment', 'Voucher'], {
    required_error: 'Please select a category',
  }),
  stock_quantity: z.coerce.number().min(0, 'Stock quantity cannot be negative'),
  unit_price: z.coerce.number().min(0, 'Unit price cannot be negative'),
  cost_price: z.coerce.number().min(0, 'Cost price cannot be negative').optional().or(z.literal('')),
  supplier: z.string().max(255, 'Supplier name is too long').optional().or(z.literal('')),
  expiry_date: z.date().optional(),
  is_redeemable: z.boolean().default(false),
  points_required: z.coerce.number().min(0, 'Points required cannot be negative').default(0),
  is_vip_only: z.boolean().default(false),
  is_promo_active: z.boolean().default(false),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

interface InventoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
  onSaved: () => void;
}

export function InventoryForm({ open, onOpenChange, item, onSaved }: InventoryFormProps) {
  const { toast } = useToast();
  const isEditing = !!item;

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: '',
      category: 'Snack',
      stock_quantity: 0,
      unit_price: 0,
      cost_price: '',
      supplier: '',
      expiry_date: undefined,
      is_redeemable: false,
      points_required: 0,
      is_vip_only: false,
      is_promo_active: false,
    },
  });

  // Reset form when item changes
  React.useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        category: item.category,
        stock_quantity: item.stock_quantity,
        unit_price: item.unit_price,
        cost_price: item.cost_price?.toString() || '',
        supplier: item.supplier || '',
        expiry_date: item.expiry_date ? new Date(item.expiry_date) : undefined,
        is_redeemable: item.is_redeemable,
        points_required: item.points_required,
        is_vip_only: item.is_vip_only,
        is_promo_active: item.is_promo_active,
      });
    } else {
      form.reset({
        name: '',
        category: 'Snack',
        stock_quantity: 0,
        unit_price: 0,
        cost_price: '',
        supplier: '',
        expiry_date: undefined,
        is_redeemable: false,
        points_required: 0,
        is_vip_only: false,
        is_promo_active: false,
      });
    }
  }, [item, form]);

  const onSubmit = async (values: InventoryFormValues) => {
    try {
      const supabase = createClient();

      // Prepare the data for submission
      const submitData = {
        name: values.name,
        category: values.category,
        stock_quantity: values.stock_quantity,
        unit_price: values.unit_price,
        cost_price: values.cost_price ? parseFloat(values.cost_price.toString()) : null,
        supplier: values.supplier || null,
        expiry_date: values.expiry_date ? format(values.expiry_date, 'yyyy-MM-dd') : null,
        is_redeemable: values.is_redeemable,
        points_required: values.is_redeemable ? values.points_required : 0,
        is_vip_only: values.is_vip_only,
        is_promo_active: values.is_promo_active,
      };

      if (isEditing && item) {
        // Update existing item
        const { error } = await supabase
          .from('inventory_items')
          .update(submitData)
          .eq('id', item.id);

        if (error) throw error;

        toast({
          title: 'Item updated',
          description: `${values.name} has been updated successfully.`,
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from('inventory_items')
          .insert([submitData]);

        if (error) throw error;

        toast({
          title: 'Item created',
          description: `${values.name} has been added to inventory.`,
        });
      }

      onSaved();
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} item. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the item details below.' 
              : 'Add a new item to your inventory.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Snack">Snack</SelectItem>
                        <SelectItem value="Drink">Drink</SelectItem>
                        <SelectItem value="Merchandise">Merchandise</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                        <SelectItem value="Voucher">Voucher</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
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
                    <FormLabel>Unit Price (KES)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
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
                    <FormLabel>Cost Price (KES)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Optional - for profit calculations</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter supplier name" {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Optional - for perishable items</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_redeemable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Loyalty Points Redeemable</FormLabel>
                      <FormDescription>
                        Allow customers to purchase this item using loyalty points
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('is_redeemable') && (
                <FormField
                  control={form.control}
                  name="points_required"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Required</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>Number of loyalty points needed to redeem this item</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="is_vip_only"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">VIP Only</FormLabel>
                      <FormDescription>
                        Only available to VIP tier customers
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_promo_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Promotion</FormLabel>
                      <FormDescription>
                        Highlight this item as a promotional offer
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting 
                  ? (isEditing ? 'Updating...' : 'Creating...') 
                  : (isEditing ? 'Update Item' : 'Create Item')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}