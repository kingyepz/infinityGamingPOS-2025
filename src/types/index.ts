
export interface Customer {
  id: string; // UUID from Supabase
  name: string;
  phone: string;
  email: string;
  loyalty_points: number;
  created_at: string; // Supabase returns TIMESTAMPTZ as a string
}

export interface GameConsole {
  id: string;
  name: string;
  status: 'available' | 'in-use' | 'maintenance';
  currentGameSessionId?: string;
}

export interface GameSession {
  id:string;
  customerId: string;
  customerName: string;
  consoleId: string;
  consoleName: string;
  gameName: string;
  startTime: Date;
  endTime?: Date;
  billingType: 'per-hour' | 'per-game';
  rate: number; // Hourly rate or per-game cost - Made this required
  durationMinutes?: number; // For hourly billing
  subtotalAmount?: number;
  vatAmount?: number;
  totalAmount?: number; // Subtotal + VAT
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  paymentMethod?: 'cash' | 'mpesa';
  mpesaReference?: string;
  pointsAwarded?: number;
  createdAt: Date;
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
