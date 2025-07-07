

export interface Customer {
  id: string; // UUID from Supabase
  created_at: string; // Supabase returns TIMESTAMPTZ as a string
  full_name: string;
  phone_number: string;
  email: string;
  loyalty_points: number;
  loyalty_tier: string;
}

export interface GameConsole {
  id: string;
  name: string;
  status: 'available' | 'in-use' | 'maintenance';
  currentGameSessionId?: string;
}

export interface GameSession {
  id: string; // UUID
  created_at: string; // TIMESTAMPTZ
  customer_id: string;
  customerName?: string; // This can be joined in queries, not a direct column
  console_id: string;
  console_name: string;
  game_name: string;
  start_time: string; // TIMESTAMPTZ
  end_time?: string | null; // TIMESTAMPTZ
  billing_type: 'per-hour' | 'per-game';
  rate: number; // NUMERIC
  duration_minutes?: number | null; // INTEGER
  subtotal_amount?: number | null; // NUMERIC
  vat_amount?: number | null; // NUMERIC
  total_amount?: number | null; // NUMERIC
  payment_status: 'pending' | 'paid' | 'cancelled'; // TEXT
  payment_method?: 'cash' | 'mpesa' | null; // TEXT
  mpesa_reference?: string | null; // TEXT
  points_awarded?: number | null; // INTEGER
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
