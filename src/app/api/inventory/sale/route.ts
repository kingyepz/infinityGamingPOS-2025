import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/inventory/sale - Process inventory sale
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { item_id, quantity, session_id, customer_id, payment_method, notes } = body;

    // Validate required fields
    if (!item_id || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Item ID and positive quantity are required' }, { status: 400 });
    }

    // Use the database function to process sale
    const { data, error } = await supabase.rpc('process_inventory_sale', {
      p_item_id: item_id,
      p_quantity: quantity,
      p_session_id: session_id || null,
      p_customer_id: customer_id || null,
      p_payment_method: payment_method || 'cash',
      p_notes: notes || null,
      p_recorded_by: user.id,
    });

    if (error) {
      console.error('Error processing sale:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error || 'Failed to process sale' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in inventory sale:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}