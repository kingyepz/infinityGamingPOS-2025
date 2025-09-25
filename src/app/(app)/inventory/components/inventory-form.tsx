"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { InventoryItem } from '../page';

const inventorySchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100, 'Name too long'),
  category: z.enum(['Snack', 'Drink', 'Merchandise', 'Equipment', 'Voucher'], {
    required_error: 'Please select a category',
  }),
  stock_quantity: z.number().int().min(0, 'Stock quantity must be 0 or greater'),
  unit_price: z.number().min(0, 'Unit price must be 0 or greater'),
  cost_price: z.number().min(0, 'Cost price must be 0 or greater').optional(),
  supplier: z.string().optional(),
  expiry_date: z.string().optional(),
  is_redeemable: z.boolean().default(false),
  points_required: z.number().min(0, 'Points required must be 0 or greater').default(0),
  is_vip_only: z.boolean().default(false),
  is_promo_active: z.boolean().default(false),
});

export type InventoryFormData = z.infer<typeof inventorySchema>;

interface InventoryFormProps {
  onSubmit: (data: InventoryFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  initialData?: InventoryItem;
}

export default function InventoryForm({ onSubmit, onCancel, isSubmitting, initialData }: InventoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: initialData ? {
      name: initialData.name,
      category: initialData.category,
      stock_quantity: initialData.stock_quantity,
      unit_price: initialData.unit_price,
      cost_price: initialData.cost_price || 0,
      supplier: initialData.supplier || '',
      expiry_date: initialData.expiry_date || '',
      is_redeemable: initialData.is_redeemable,
      points_required: initialData.points_required,
      is_vip_only: initialData.is_vip_only,
      is_promo_active: initialData.is_promo_active,
    } : {
      name: '',
      category: 'Snack',
      stock_quantity: 0,
      unit_price: 0,
      cost_price: 0,
      supplier: '',
      expiry_date: '',
      is_redeemable: false,
      points_required: 0,
      is_vip_only: false,
      is_promo_active: false,
    },
  });

  const isRedeemable = watch('is_redeemable');
  const category = watch('category');

  const handleFormSubmit = (data: InventoryFormData) => {
    // If not redeemable, reset points to 0
    if (!data.is_redeemable) {
      data.points_required = 0;
    }
    
    // Convert empty strings to null for optional fields
    const processedData = {
      ...data,
      supplier: data.supplier || undefined,
      expiry_date: data.expiry_date || undefined,
      cost_price: data.cost_price || undefined,
    };
    
    onSubmit(processedData);
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Item Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., Coca Cola 500ml"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select 
            value={category} 
            onValueChange={(value) => setValue('category', value as any)}
          >
            <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Snack">Snack</SelectItem>
              <SelectItem value="Drink">Drink</SelectItem>
              <SelectItem value="Merchandise">Merchandise</SelectItem>
              <SelectItem value="Equipment">Equipment</SelectItem>
              <SelectItem value="Voucher">Voucher</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
        </div>

        {/* Stock Quantity */}
        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Stock Quantity *</Label>
          <Input
            id="stock_quantity"
            type="number"
            min="0"
            {...register('stock_quantity', { valueAsNumber: true })}
            placeholder="0"
            className={errors.stock_quantity ? 'border-destructive' : ''}
          />
          {errors.stock_quantity && <p className="text-sm text-destructive">{errors.stock_quantity.message}</p>}
        </div>

        {/* Unit Price */}
        <div className="space-y-2">
          <Label htmlFor="unit_price">Unit Price (KES) *</Label>
          <Input
            id="unit_price"
            type="number"
            min="0"
            step="0.01"
            {...register('unit_price', { valueAsNumber: true })}
            placeholder="0.00"
            className={errors.unit_price ? 'border-destructive' : ''}
          />
          {errors.unit_price && <p className="text-sm text-destructive">{errors.unit_price.message}</p>}
        </div>

        {/* Cost Price */}
        <div className="space-y-2">
          <Label htmlFor="cost_price">Cost Price (KES)</Label>
          <Input
            id="cost_price"
            type="number"
            min="0"
            step="0.01"
            {...register('cost_price', { valueAsNumber: true })}
            placeholder="0.00"
            className={errors.cost_price ? 'border-destructive' : ''}
          />
          {errors.cost_price && <p className="text-sm text-destructive">{errors.cost_price.message}</p>}
        </div>

        {/* Supplier */}
        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Input
            id="supplier"
            {...register('supplier')}
            placeholder="e.g., Local Distributor Ltd"
          />
        </div>

        {/* Expiry Date */}
        <div className="space-y-2">
          <Label htmlFor="expiry_date">Expiry Date</Label>
          <Input
            id="expiry_date"
            type="date"
            {...register('expiry_date')}
          />
        </div>

        {/* Points Required (only if redeemable) */}
        {isRedeemable && (
          <div className="space-y-2">
            <Label htmlFor="points_required">Points Required</Label>
            <Input
              id="points_required"
              type="number"
              min="0"
              {...register('points_required', { valueAsNumber: true })}
              placeholder="0"
              className={errors.points_required ? 'border-destructive' : ''}
            />
            {errors.points_required && <p className="text-sm text-destructive">{errors.points_required.message}</p>}
          </div>
        )}
      </div>

      {/* Feature Toggles */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium">Item Features</h4>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="is_redeemable" className="text-base">
              Redeemable with Loyalty Points
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow customers to purchase with loyalty points
            </p>
          </div>
          <Switch
            id="is_redeemable"
            checked={isRedeemable}
            onCheckedChange={(checked) => setValue('is_redeemable', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="is_vip_only" className="text-base">
              VIP Only
            </Label>
            <p className="text-sm text-muted-foreground">
              Only visible to VIP tier customers
            </p>
          </div>
          <Switch
            id="is_vip_only"
            {...register('is_vip_only')}
            checked={watch('is_vip_only')}
            onCheckedChange={(checked) => setValue('is_vip_only', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="is_promo_active" className="text-base">
              Promotional Item
            </Label>
            <p className="text-sm text-muted-foreground">
              Highlight as a promotional item
            </p>
          </div>
          <Switch
            id="is_promo_active"
            {...register('is_promo_active')}
            checked={watch('is_promo_active')}
            onCheckedChange={(checked) => setValue('is_promo_active', checked)}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
}