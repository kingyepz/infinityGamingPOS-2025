
export interface Customer {
  id: string; // UUID from Supabase
  created_at: string; // Supabase returns TIMESTAMPTZ as a string
  updated_at: string;
  full_name: string;
  phone_number: string;
  email: string;
  loyalty_points: number;
  loyalty_tier: string;
  join_date: string;
}

export interface Station {
  id: string;
  name: string;
  status: 'available' | 'in-use' | 'maintenance';
  currentSessionId?: string;
}

export interface Session {
  // Fields that map directly to the 'sessions' table in Supabase
  id: string;
  customer_id: string;
  station_id: string;
  game_name: string; // User's table has game_id, but we'll use game_name for simplicity until games table is defined
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  session_type: 'per-hour' | 'per-game';
  amount_charged?: number | null;
  payment_status: 'pending' | 'paid' | 'cancelled';
  points_earned?: number | null;
  created_at: string;
  
  // Client-side fields for UI display, state management, and calculations
  customerName?: string;
  stationName?: string;
  rate: number; // For calculation, not stored in DB
  payment_method?: 'cash' | 'mpesa' | null;
  mpesa_reference?: string | null;
}


export interface SupportTicket {
  id: string;
  query: string;
  category?: string;
  confidence?: number;
  createdAt: Date;
  status: 'new' | 'categorized' | 'resolved';
}

export interface Staff {
    id: string;
    name: string;
    initials: string;
    revenueToday: number;
    sessions: number;
}
