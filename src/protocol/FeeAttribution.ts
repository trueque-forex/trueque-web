export type FeeAttribution = {
  matchId: string; // Unique match identifier
  corridorId: string; // e.g., 'US-CL'
  senderId: string; // e.g., 'A123'
  senderCurrency: string; // e.g., 'USD'
  recipientCountry: string; // Country where sender's designated recipient lives
  deliverySpeed: 'instant' | 'same-day' | 'next-day'; // Sender's chosen speed
  feeAmount: number; // Total fee charged to sender
  feeBreakdown: {
    baseFee: number; // Fixed cost per corridor
    speedMultiplier: number; // Multiplier based on delivery speed
    corridorAdjustment: number; // Corridor-specific adjustment (e.g., regulatory, FX spread)
  };
  timestamp: string; // ISO timestamp of fee calculation
  slaSeconds: number; // SLA for delivery
  bufferSeconds: number; // Grace buffer for fallback logic
  fallbackTriggered: boolean; // True if SLA + buffer breached
};
