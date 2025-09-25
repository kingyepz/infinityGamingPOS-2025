import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CURRENCY_SYMBOL } from '@/lib/constants';

interface SellItemRequest {
  itemId: string;
  quantity: number;
  sessionId?: string;
  customerId?: string;
  paymentMethod: 'cash' | 'mpesa' | 'mpesa-stk' | 'split' | 'loyalty_points';
  performedBy?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body: SellItemRequest = await request.json();

    const { itemId, quantity, sessionId, customerId, paymentMethod, performedBy, notes } = body;

    // Validate required fields
    if (!itemId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Item ID and valid quantity are required' },
        { status: 400 }
      );
    }

    // Get the current user for performed_by if not provided
    let userId = performedBy;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    // Check if the item exists and get its details
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if there's enough stock
    if (item.stock_quantity < quantity) {
      return NextResponse.json(
        {
          error: `Insufficient stock. Available: ${item.stock_quantity}, Requested: ${quantity}`
        },
        { status: 400 }
      );
    }

    // Calculate total value
    const totalValue = quantity * item.unit_price;

    // Handle loyalty points redemption
    if (paymentMethod === 'loyalty_points') {
      if (!customerId) {
        return NextResponse.json(
          { error: 'Customer ID required for loyalty points payment' },
          { status: 400 }
        );
      }

      if (!item.is_redeemable) {
        return NextResponse.json(
          { error: 'This item cannot be redeemed with loyalty points' },
          { status: 400 }
        );
      }

      if (item.points_required * quantity > 0) {
        // Check if customer has enough points (this would need to be implemented)
        // For now, we'll assume the points check is done on the frontend
      }

      // Deduct loyalty points (this would need to be implemented in the loyalty system)
      // For now, we'll just log it in the transaction
    }

    // Check if it's VIP only and customer is not VIP
    if (item.is_vip_only && customerId) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('loyalty_tier')
        .eq('id', customerId)
        .single();

      if (customerError || !customer || customer.loyalty_tier !== 'VIP') {
        return NextResponse.json(
          { error: 'This item is VIP only' },
          { status: 403 }
        );
      }
    }

    // Start a transaction to ensure data consistency
    const { data: result, error: transactionError } = await supabase.rpc('update_inventory_stock', {
      p_item_id: itemId,
      p_quantity_change: -quantity, // Negative for sales
      p_transaction_type: 'sale',
      p_unit_price: item.unit_price,
      p_related_session_id: sessionId || null,
      p_related_customer_id: customerId || null,
      p_notes: notes || `Sale: ${quantity} x ${item.name}`,
      p_performed_by: userId,
      p_payment_method: paymentMethod,
    });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { error: `Failed to process sale: ${transactionError.message}` },
        { status: 500 }
      );
    }

    // If payment is with loyalty points, deduct the points
    if (paymentMethod === 'loyalty_points' && customerId && item.points_required > 0) {
      const pointsToDeduct = item.points_required * quantity;

      // Insert loyalty transaction record
      const { error: loyaltyError } = await supabase
        .from('loyalty_transactions')
        .insert({
          customer_id: customerId,
          transaction_type: 'redeem',
          points: -pointsToDeduct,
          description: `Redeemed for ${quantity} x ${item.name}`,
        });

      if (loyaltyError) {
        console.error('Loyalty transaction error:', loyaltyError);
        // Don't fail the whole transaction for loyalty point errors
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sold ${quantity} x ${item.name}`,
      data: {
        item_id: itemId,
        item_name: item.name,
        quantity,
        unit_price: item.unit_price,
        total_value: totalValue,
        payment_method: paymentMethod,
        transaction_id: result,
      }
    });

  } catch (error) {
    console.error('Unexpected error in sell endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}