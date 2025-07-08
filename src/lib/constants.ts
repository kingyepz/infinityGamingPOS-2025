

import type { Staff } from '@/types';

export const VAT_RATE = 0.16;
export const POINTS_PER_CURRENCY_UNIT = 0.1; 
export const CURRENCY_SYMBOL = 'KES';

export const BUSINESS_DETAILS = {
  name: "Infinity Gaming Lounge",
  address: "123 Gamer Street, Tech City, Kenya",
  phone: "+254 700 123 456",
  email: "support@infinitygaming.co.ke",
  kraPin: "P012345678X" // Kenya Revenue Authority PIN
};

export const CONSOLE_PLATFORMS = [
    "PlayStation 5",
    "PlayStation 4",
    "Xbox Series X",
    "Xbox Series S",
    "Xbox One",
    "Nintendo Switch",
    "Gaming PC",
    "VR Headset"
] as const;


export const MOCK_STAFF_PERFORMANCE: Staff[] = [
  { id: 'staff-1', name: 'Alice Johnson', initials: 'AJ', revenueToday: 1250, sessions: 5 },
  { id: 'staff-2', name: 'Bob Williams', initials: 'BW', revenueToday: 980, sessions: 4 },
  { id: 'staff-3', name: 'Charlie Brown', initials: 'CB', revenueToday: 760, sessions: 3 },
];
