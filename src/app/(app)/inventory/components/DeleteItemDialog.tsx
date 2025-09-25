"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InventoryItem } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface DeleteItemDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteItemDialog({ item, open, onOpenChange, onSuccess }: DeleteItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleDelete = async () => {
    if (!item) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', item.id);

      if (error) {
        console.error('Error deleting item:', error);
        toast({
          title: 'Error',
          description: `Failed to delete item: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: `${item.name} has been deleted from inventory`,
        });
        onOpenChange(false);
        onSuccess();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while deleting the item',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Inventory Item
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{item.name}</strong> from your inventory?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will permanently delete the item and all associated transaction records.
              Consider adjusting stock to zero instead if you want to keep the history.
            </AlertDescription>
          </Alert>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item:</span>
              <span className="font-medium">{item.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span>{item.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Stock:</span>
              <span>{item.stock_quantity} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Price:</span>
              <span>KES {item.unit_price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deleting...' : 'Delete Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}