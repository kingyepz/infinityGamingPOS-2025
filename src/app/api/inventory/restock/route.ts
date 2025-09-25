import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/inventory/restock - Restock an inventory item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { item_id, quantity, cost_price, supplier, notes } = body;

    // Validate required fields
    if (!item_id || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Item ID and positive quantity are required' }, { status: 400 });
    }

    // Use the database function to process restock
    const { data, error } = await supabase.rpc('process_inventory_restock', {
      p_item_id: item_id,
      p_quantity: quantity,
      p_cost_price: cost_price || null,
      p_supplier: supplier || null,
      p_notes: notes || null,
      p_recorded_by: user.id,
    });

    if (error) {
      console.error('Error processing restock:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error || 'Failed to process restock' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in inventory restock:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}