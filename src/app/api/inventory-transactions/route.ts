import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('item_id');
  let query = supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false }).limit(200);
  if (itemId) query = query.eq('item_id', itemId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ transactions: data });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { item_id, delta, type, unit_price, note, session_id, customer_id } = body;
  if (!item_id || !delta || !type) {
    return NextResponse.json({ error: 'item_id, delta, and type are required' }, { status: 400 });
  }
  // Use DB function for atomicity and safeguards
  const { error } = await supabase.rpc('adjust_inventory_stock', {
    p_item_id: item_id,
    p_delta: delta,
    p_type: type,
    p_unit_price: unit_price ?? null,
    p_note: note ?? null,
    p_session_id: session_id ?? null,
    p_customer_id: customer_id ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

