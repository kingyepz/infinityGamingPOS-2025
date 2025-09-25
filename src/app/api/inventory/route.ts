import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/inventory - Fetch all inventory items
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock');

    let query = supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,supplier.ilike.%${search}%`);
    }

    if (lowStock === 'true') {
      query = query.lt('stock_quantity', 5);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching inventory items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add computed fields
    const itemsWithComputed = data.map(item => ({
      ...item,
      stock_value: item.unit_price * item.stock_quantity,
      is_low_stock: item.stock_quantity < 5,
      days_to_expiry: item.expiry_date 
        ? Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null
    }));

    return NextResponse.json(itemsWithComputed);
  } catch (error) {
    console.error('Error in inventory GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/inventory - Create new inventory item
export async function POST(request: NextRequest) {
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
      .insert([{
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
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in inventory POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}