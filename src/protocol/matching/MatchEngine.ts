import { corridorRegistry } from "../../../../trueque_mobile/backend/config/CorridorRegistry";

interface Sender {
  senderId: string;
  amount: number;
  currency: string;
  deliverySpeed: string;
  estimatedDeliveryMs: number;
}

interface MatchResult {
  matchId: string;
  corridorId: string;
  breachFlags: string[];
  fallbackUsed: boolean;
  feeAttribution: string;
}

export function matchSenders(senderA: Sender, senderB: Sender): MatchResult {
  const corridorId = `${senderA.currency}-${senderB.currency}`;
  const config = corridorRegistry[corridorId];

  const breachFlags: string[] = [];
  let fallbackUsed = false;

  if (!config) {
    breachFlags.push("UNSUPPORTED_CORRIDOR");
    fallbackUsed = true;
  } else {
    if (!config.supportedCurrencies.includes(senderA.currency)) breachFlags.push("UNSUPPORTED_CURRENCY_A");
    if (!config.supportedCurrencies.includes(senderB.currency)) breachFlags.push("UNSUPPORTED_CURRENCY_B");

    if (senderA.estimatedDeliveryMs > config.maxDeliveryMs) breachFlags.push("SLA_BREACH_A");
    if (senderB.estimatedDeliveryMs > config.maxDeliveryMs) breachFlags.push("SLA_BREACH_B");

    if (senderA.deliverySpeed !== senderB.deliverySpeed) breachFlags.push("SPEED_MISMATCH");

    fallbackUsed = breachFlags.length > 0;
  }

  return {
    matchId: `${senderA.senderId}_${senderB.senderId}`,
    corridorId,
    breachFlags,
    fallbackUsed,
    feeAttribution: config?.feeAttribution ?? "sender",
  };
}