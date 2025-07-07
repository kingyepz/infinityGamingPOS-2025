
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

// This interface now more closely matches the 'sessions' table schema.
// UI-specific or calculated fields are kept separate or clearly marked.
export interface Session {
  id: string; // uuid
  customer_id: string; // uuid
  station_id: string; // uuid
  game_name: string; // text - used instead of game_id for now
  start_time: string; // timestamptz
  end_time?: string | null; // timestamptz
  duration_minutes?: number | null; // integer
  session_type: 'per-hour' | 'per-game'; // text
  amount_charged?: number | null; // numeric
  payment_status: 'pending' | 'paid' | 'cancelled'; // text
  points_earned?: number | null; // integer
  created_at: string; // timestamptz
  notes?: string | null; // text
  
  // Client-side fields for UI display, state management, and calculations
  customerName: string; // Fetched via join or lookup
  stationName: string; // Fetched via join or lookup
  rate: number; // For calculation, not stored directly in DB
  payment_method?: 'cash' | 'mpesa' | null; // Assumed to exist in DB
  mpesa_reference?: string | null; // Assumed to exist in DB
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
