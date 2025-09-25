"use client";

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { InventoryItem } from '@/types';

interface DeleteItemDialogProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export function DeleteItemDialog({ item, onClose }: DeleteItemDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error('No item selected');
      
      const supabase = createClient();
      
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Item Deleted",
        description: `"${item?.name}" has been successfully deleted from inventory.`,
      });
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Item
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{item.name}" from your inventory? 
            This action cannot be undone and will also delete all related transaction history.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-sm space-y-1">
            <div><strong>Item:</strong> {item.name}</div>
            <div><strong>Category:</strong> {item.category}</div>
            <div><strong>Current Stock:</strong> {item.stock_quantity} units</div>
            <div><strong>Stock Value:</strong> KES {(item.stock_quantity * item.unit_price).toFixed(2)}</div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}