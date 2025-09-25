"use client";

import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { InventoryPOS, type InventorySale } from '../../inventory/components/inventory-pos-integration';
import { processInventorySale, validateInventoryAvailability } from '../../inventory/lib/inventory-sales';
import { Customer, Session } from '@/types';

interface InventorySalesButtonProps {
  customer?: Customer;
  session?: Session;
  onSaleComplete?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export function InventorySalesButton({ 
  customer, 
  session,
  onSaleComplete,
  disabled = false,
  variant = 'outline',
  size = 'sm'
}: InventorySalesButtonProps) {
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSaleComplete = async (sale: InventorySale) => {
    setIsProcessing(true);

    try {
      // Validate inventory availability
      const validation = await validateInventoryAvailability(sale.items);
      if (!validation.valid) {
        toast({
          title: 'Inventory Error',
          description: validation.errors.join('\n'),
          variant: 'destructive',
        });
        return;
      }

      // Process the sale
      const result = await processInventorySale({
        sale,
        recordedBy: undefined, // TODO: Get current user ID
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to process sale');
      }

      // Success notification
      const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      const pointsMessage = result.loyaltyPointsDeducted && result.loyaltyPointsEarned 
        ? ` (${result.loyaltyPointsDeducted} pts used, ${result.loyaltyPointsEarned} pts earned)`
        : result.loyaltyPointsDeducted 
        ? ` (${result.loyaltyPointsDeducted} pts used)`
        : result.loyaltyPointsEarned 
        ? ` (${result.loyaltyPointsEarned} pts earned)`
        : '';

      toast({
        title: 'Sale completed',
        description: `Successfully sold ${itemCount} item${itemCount !== 1 ? 's' : ''} for KES ${sale.total_amount.toFixed(2)}${pointsMessage}`,
      });

      // Close POS and notify parent
      setIsPOSOpen(false);
      onSaleComplete?.();

    } catch (error) {
      console.error('Error completing sale:', error);
      toast({
        title: 'Sale failed',
        description: error instanceof Error ? error.message : 'Failed to process inventory sale',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsPOSOpen(true)}
        disabled={disabled || isProcessing}
        className="gap-2"
      >
        <ShoppingCart className="h-4 w-4" />
        {size !== 'sm' && 'Sell Items'}
        {customer && (
          <Badge variant="secondary" className="ml-1">
            {customer.loyalty_points} pts
          </Badge>
        )}
      </Button>

      <InventoryPOS
        open={isPOSOpen}
        onOpenChange={setIsPOSOpen}
        customer={customer}
        sessionId={session?.id}
        onSaleComplete={handleSaleComplete}
      />
    </>
  );
}