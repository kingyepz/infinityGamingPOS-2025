
import type { Staff } from '@/types';

export const VAT_RATE = 0.16;
export const POINTS_PER_CURRENCY_UNIT = 0.1; 
export const CURRENCY_SYMBOL = 'KES';

export const MOCK_STAFF_PERFORMANCE: Staff[] = [
  { id: 'staff-1', name: 'Brian K.', initials: 'BK', revenueToday: 7200, sessions: 15 },
  { id: 'staff-2', name: 'Fatima A.', initials: 'FA', revenueToday: 5450, sessions: 11 },
  { id: 'staff-3', name: 'Leo M.', initials: 'LM', revenueToday: 3000, sessions: 8 },
]

export const BUSINESS_DETAILS = {
  name: "Infinity Gaming Lounge",
  address: "123 Gamer Street, Tech City, Kenya",
  phone: "+254 700 123 456",
  email: "support@infinitygaming.co.ke",
  kraPin: "P012345678X" // Kenya Revenue Authority PIN
};
