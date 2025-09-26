import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin or supervisor role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin', 'supervisor'].includes(userData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const tournamentId = params.id;

    // Create a service role client for privileged operations
    const serviceSupabase = createClient(cookieStore, {
      auth: {
        persistSession: false,
      },
    });

    // Complete the tournament and award rewards using the service role
    const { error: completeError } = await serviceSupabase.rpc('complete_tournament', {
      tournament_uuid: tournamentId
    });

    if (completeError) {
      console.error('Error completing tournament:', completeError);
      return NextResponse.json({ 
        error: 'Failed to complete tournament',
        details: completeError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Tournament completed and rewards awarded'
    });

  } catch (error) {
    console.error('Tournament completion error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}