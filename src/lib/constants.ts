
import type { GameConsole } from '@/types';

export const VAT_RATE = 0.16; // 16%
export const POINTS_PER_CURRENCY_UNIT = 0.1; // e.g., 1 point per 10 currency units spent
export const CURRENCY_SYMBOL = 'KES'; // Kenyan Shilling, or your local currency

export const MOCK_GAME_CONSOLES: GameConsole[] = [
  { id: 'ps5-1', name: 'PlayStation 5 - Console 1', status: 'available' },
  { id: 'ps5-2', name: 'PlayStation 5 - Console 2', status: 'available' },
  { id: 'xbox-1', name: 'Xbox Series X - Console 1', status: 'available' },
  { id: 'pc-1', name: 'Gaming PC - Rig 1', status: 'available' },
  { id: 'pc-2', name: 'Gaming PC - Rig 2', status: 'maintenance' },
  { id: 'vr-1', name: 'VR Headset - Unit 1', status: 'available' },
];

export const BUSINESS_DETAILS = {
  name: "Infinity Gaming Lounge",
  address: "123 Gamer Street, Tech City, Kenya",
  phone: "+254 700 123 456",
  email: "support@infinitygaming.co.ke",
  kraPin: "P012345678X" // Kenya Revenue Authority PIN
};
