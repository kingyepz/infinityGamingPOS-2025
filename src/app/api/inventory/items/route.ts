import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const showLowStock = searchParams.get('showLowStock') === 'true';
    const showPromo = searchParams.get('showPromo') === 'true';
    const showVipOnly = searchParams.get('showVipOnly') === 'true';
    const showRedeemable = searchParams.get('showRedeemable') === 'true';
    const customerId = searchParams.get('customerId'); // For VIP filtering

    let query = supabase
      .from('inventory_items')
      .select('*')
      .gte('stock_quantity', 1); // Only show items with stock

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%`);
    }

    if (showLowStock) {
      // This would need to be implemented with a proper low stock check
      // For now, we'll show items with stock <= threshold
    }

    if (showPromo) {
      query = query.eq('is_promo_active', true);
    }

    if (showVipOnly) {
      // Check if customer is VIP
      if (customerId) {
        const { data: customer } = await supabase
          .from('customers')
          .select('loyalty_tier')
          .eq('id', customerId)
          .single();

        if (customer?.loyalty_tier === 'VIP') {
          query = query.eq('is_vip_only', true);
        } else {
          // Non-VIP customers can't see VIP items
          query = query.eq('is_vip_only', false);
        }
      } else {
        // No customer specified, don't show VIP items
        query = query.eq('is_vip_only', false);
      }
    } else {
      // If not specifically asking for VIP items, exclude them
      query = query.eq('is_vip_only', false);
    }

    if (showRedeemable) {
      query = query.eq('is_redeemable', true);
    }

    query = query.order('name', { ascending: true });

    const { data: items, error } = await query;

    if (error) {
      console.error('Error fetching inventory items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inventory items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: items,
      count: items?.length || 0,
    });

  } catch (error) {
    console.error('Unexpected error in inventory items endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}