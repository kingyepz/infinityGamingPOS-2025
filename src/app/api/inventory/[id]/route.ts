import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/inventory/[id] - Fetch single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching inventory item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Add computed fields
    const itemWithComputed = {
      ...data,
      stock_value: data.unit_price * data.stock_quantity,
      is_low_stock: data.stock_quantity < 5,
      days_to_expiry: data.expiry_date 
        ? Math.ceil((new Date(data.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null
    };

    return NextResponse.json(itemWithComputed);
  } catch (error) {
    console.error('Error in inventory GET by ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/inventory/[id] - Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const { name, category, stock_quantity, unit_price } = body;
    if (!name || !category || stock_quantity === undefined || unit_price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        name: body.name,
        category: body.category,
        stock_quantity: body.stock_quantity,
        unit_price: body.unit_price,
        cost_price: body.cost_price || null,
        supplier: body.supplier || null,
        expiry_date: body.expiry_date || null,
        is_redeemable: body.is_redeemable || false,
        points_required: body.points_required || 0,
        is_vip_only: body.is_vip_only || false,
        is_promo_active: body.is_promo_active || false,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating inventory item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in inventory PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting inventory item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error in inventory DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}