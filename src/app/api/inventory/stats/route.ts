import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/inventory/stats - Get inventory statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the database function to get stats
    const { data, error } = await supabase.rpc('get_inventory_stats');

    if (error) {
      console.error('Error fetching inventory stats:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in inventory stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}