import { createClient } from '@/lib/supabase/client';
import { InventorySale, CartItem } from '../components/inventory-pos-integration';

export interface ProcessInventorySaleParams {
  sale: InventorySale;
  recordedBy?: string;
}

export interface InventorySaleResult {
  success: boolean;
  error?: string;
  transactionIds?: string[];
  loyaltyPointsEarned?: number;
  loyaltyPointsDeducted?: number;
}

export async function processInventorySale({ 
  sale, 
  recordedBy 
}: ProcessInventorySaleParams): Promise<InventorySaleResult> {
  const supabase = createClient();

  try {
    // Start a transaction by processing each item
    const transactionPromises: Promise<any>[] = [];
    let totalLoyaltyPointsEarned = 0;

    // Process each item in the cart
    for (const item of sale.items) {
      // Determine payment method and points used for this item
      const itemPointsUsed = item.is_redeemable 
        ? Math.min(item.points_required * item.quantity, sale.total_points_used)
        : 0;
      
      const itemCashAmount = (item.unit_price * item.quantity) - itemPointsUsed;

      // Update inventory stock using the stored procedure
      const stockUpdatePromise = supabase.rpc('update_inventory_stock', {
        p_item_id: item.id,
        p_quantity_change: -item.quantity, // Negative for sales
        p_transaction_type: 'sale',
        p_unit_price: item.unit_price,
        p_session_id: sale.session_id || null,
        p_customer_id: sale.customer_id || null,
        p_payment_method: sale.payment_method,
        p_loyalty_points_used: itemPointsUsed,
        p_notes: `POS Sale - ${item.quantity} units`,
        p_recorded_by: recordedBy || null,
      });

      transactionPromises.push(stockUpdatePromise);

      // Calculate loyalty points earned (only for cash portion)
      if (itemCashAmount > 0 && sale.customer_id) {
        // Assuming 1 point per 10 KES spent (adjust as needed)
        totalLoyaltyPointsEarned += Math.floor(itemCashAmount / 10);
      }
    }

    // Execute all stock updates
    const stockResults = await Promise.all(transactionPromises);

    // Check for any failures
    const failedUpdates = stockResults.filter(result => {
      const data = result.data as { success: boolean; error?: string };
      return !data.success;
    });

    if (failedUpdates.length > 0) {
      const errors = failedUpdates.map(result => result.data?.error || 'Unknown error');
      throw new Error(`Stock update failed: ${errors.join(', ')}`);
    }

    // Update customer loyalty points if applicable
    let loyaltyPointsDeducted = 0;
    if (sale.customer_id) {
      // Deduct used points and add earned points
      const netPointsChange = totalLoyaltyPointsEarned - sale.total_points_used;
      loyaltyPointsDeducted = sale.total_points_used;

      if (netPointsChange !== 0) {
        const { error: loyaltyError } = await supabase
          .from('customers')
          .update({
            loyalty_points: supabase.raw(`loyalty_points + ${netPointsChange}`)
          })
          .eq('id', sale.customer_id);

        if (loyaltyError) {
          console.error('Error updating loyalty points:', loyaltyError);
          // Don't fail the entire transaction for loyalty point errors
        }

        // Record loyalty transaction
        if (sale.total_points_used > 0) {
          await supabase
            .from('loyalty_transactions')
            .insert({
              customer_id: sale.customer_id,
              session_id: sale.session_id,
              transaction_type: 'redeem',
              points: -sale.total_points_used,
              description: `Inventory purchase - ${sale.items.length} items`,
            });
        }

        if (totalLoyaltyPointsEarned > 0) {
          await supabase
            .from('loyalty_transactions')
            .insert({
              customer_id: sale.customer_id,
              session_id: sale.session_id,
              transaction_type: 'earn',
              points: totalLoyaltyPointsEarned,
              description: `Inventory purchase - earned from ${sale.total_amount.toFixed(2)} KES`,
            });
        }
      }
    }

    // Extract transaction IDs from successful updates
    const transactionIds = stockResults
      .map(result => result.data?.transaction_id)
      .filter(Boolean);

    return {
      success: true,
      transactionIds,
      loyaltyPointsEarned: totalLoyaltyPointsEarned,
      loyaltyPointsDeducted,
    };

  } catch (error) {
    console.error('Error processing inventory sale:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function validateInventoryAvailability(items: CartItem[]): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const supabase = createClient();
  const errors: string[] = [];

  try {
    // Get current stock levels for all items
    const itemIds = items.map(item => item.id);
    const { data: currentStock, error } = await supabase
      .from('inventory_items')
      .select('id, name, stock_quantity')
      .in('id', itemIds);

    if (error) {
      return { valid: false, errors: ['Failed to validate inventory availability'] };
    }

    // Check each item
    for (const cartItem of items) {
      const stockItem = currentStock?.find(stock => stock.id === cartItem.id);
      
      if (!stockItem) {
        errors.push(`Item "${cartItem.name}" not found`);
        continue;
      }

      if (stockItem.stock_quantity < cartItem.quantity) {
        errors.push(`Insufficient stock for "${cartItem.name}". Available: ${stockItem.stock_quantity}, Requested: ${cartItem.quantity}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };

  } catch (error) {
    return {
      valid: false,
      errors: ['Failed to validate inventory availability'],
    };
  }
}

// Utility to get inventory items suitable for POS
export async function getPOSInventoryItems(customerTier?: string): Promise<any[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('inventory_items')
    .select('*')
    .gt('stock_quantity', 0)
    .order('category')
    .order('name');

  // Filter VIP items if customer is not VIP
  if (customerTier !== 'VIP') {
    query = query.eq('is_vip_only', false);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching POS inventory: ${error.message}`);
  }

  return data || [];
}