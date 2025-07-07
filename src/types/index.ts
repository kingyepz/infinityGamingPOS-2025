
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  createdAt: Date;
  sessionHistory?: Pick<GameSession, 'id' | 'gameName' | 'startTime' | 'totalAmount' | 'pointsAwarded'>[];
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
