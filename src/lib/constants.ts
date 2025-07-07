
import type { GameConsole, Staff } from '@/types';

export const VAT_RATE = 0.16; // 16%
export const POINTS_PER_CURRENCY_UNIT = 0.1; // e.g., 1 point per 10 currency units spent
export const CURRENCY_SYMBOL = 'KES'; // Kenyan Shilling, or your local currency

export const MOCK_GAME_CONSOLES: GameConsole[] = [
  { id: 'ps5-1', name: 'PlayStation 5 - Console 1', status: 'in-use' },
  { id: 'ps5-2', name: 'PlayStation 5 - Console 2', status: 'available' },
  { id: 'xbox-1', name: 'Xbox Series X - Console 1', status: 'in-use' },
  { id: 'pc-1', name: 'Gaming PC - Rig 1', status: 'available' },
  { id: 'pc-2', name: 'Gaming PC - Rig 2', status: 'maintenance' },
  { id: 'vr-1', name: 'VR Headset - Unit 1', status: 'available' },
];

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
