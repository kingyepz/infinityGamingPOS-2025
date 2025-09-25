

import type { CONSOLE_PLATFORMS } from "@/lib/constants";

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
  dob?: string | null;
  isActive?: boolean;
  loyalty_transactions?: LoyaltyTransaction[];
  offers?: CustomerOffer[];
  // Loyalty and visibility helpers for inventory
  is_vip?: boolean;
}

export interface Station {
  id: string; // uuid
  name: string; // text
  type: string; // text - Changed from console_type
  status: 'available' | 'in-use' | 'maintenance'; // text
  location?: string | null; // text
  notes?: string | null; // text
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface Game {
  id: string; // uuid
  name: string; // text
  platforms?: (typeof CONSOLE_PLATFORMS[number])[] | null;
  genre?: string | null; // text
  description?: string | null; // text
  cover_image_url?: string | null; // text
  release_date?: string | null; // date
  developer?: string | null; // text
  publisher?: string | null; // text
  is_active: boolean; // boolean
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}


// This interface now more closely matches the 'sessions' table schema.
// UI-specific or calculated fields are kept separate or clearly marked.
export interface Session {
  id: string; // uuid
  customer_id: string; // uuid
  secondary_customer_id?: string | null; // uuid for second player
  station_id: string; // uuid
  game_id?: string | null; // uuid
  start_time: string; // timestamptz
  end_time?: string | null; // timestamptz
  duration_minutes?: number | null; // integer
  session_type: 'per-hour' | 'per-game'; // text
  amount_charged?: number | null; // numeric
  payment_status: 'pending' | 'paid' | 'cancelled'; // text
  points_earned?: number | null; // integer
  created_at: string; // timestamptz
  notes?: string | null; // text
  payment_method?: 'cash' | 'mpesa' | 'mpesa-stk' | null; // Added 'mpesa-stk'
  mpesa_reference?: string | null; // Assumed to exist in DB
  recorded_by?: string | null; // uuid of user who processed payment
  offer_id?: string | null; // uuid of the offer used for this session
  
  // Client-side fields for UI display, state management, and calculations
  customerName: string; // Fetched via join or lookup
  secondaryCustomerName?: string | null; // Fetched via join
  customerPhoneNumber?: string | null; // Added for STK push
  stationName: string; // Fetched via join or lookup
  game_name?: string; // Fetched via join or lookup
  rate: number; // For calculation, not stored directly in DB
  recorderName?: string | null; // Fetched via join on recorded_by
  // POS cart fields (not stored in DB)
  cart_items?: SessionCartItem[];
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

export interface LoyaltyTransaction {
  id: string; // uuid
  customer_id: string; // uuid
  session_id?: string | null; // uuid
  transaction_type: 'earn' | 'redeem' | 'bonus';
  points: number;
  description?: string | null;
  created_at: string;
}

export interface CustomerOffer {
  id: string; // uuid
  customer_id: string; // uuid
  type: 'free_hour' | 'discount_percent' | 'discount_amount' | 'birthday_reward';
  value: number;
  description: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
  used_at?: string | null;
  session_id?: string | null;
}

// --- Inventory ---
export type InventoryCategory = 'Snack' | 'Drink' | 'Merchandise' | 'Equipment' | 'Voucher';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  stock_quantity: number;
  unit_price: number;
  cost_price?: number | null;
  supplier?: string | null;
  expiry_date?: string | null; // date string
  is_redeemable: boolean;
  points_required: number; // numeric
  is_vip_only: boolean;
  is_promo_active: boolean;
  created_at: string;
  updated_at: string;
}

export type InventoryChangeType = 'add' | 'sale' | 'adjustment' | 'redeem';

export interface InventoryTransaction {
  id: string;
  item_id: string;
  change_type: InventoryChangeType;
  quantity_change: number; // positive for stock in, negative for out
  unit_price_at_time?: number | null;
  session_id?: string | null;
  payer_customer_id?: string | null;
  notes?: string | null;
  created_at: string;
  created_by?: string | null;
}

export interface SessionCartItem {
  item: InventoryItem;
  quantity: number;
}
