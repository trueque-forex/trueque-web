import { FeeAttribution } from '../fees/FeeAttribution';
import { logAuditEntry } from '../audit/AuditLogger';

export function simulateDelivery(fee: FeeAttribution): FeeAttribution {
  const simulatedDeliveryTime = Math.floor(Math.random() * 100); // seconds
  const totalAllowedTime = fee.slaSeconds + fee.bufferSeconds;

  const fallbackTriggered = simulatedDeliveryTime > totalAllowedTime;

  const updatedFee: FeeAttribution = {
    ...fee,
    fallbackTriggered
  };

  logAuditEntry({
    matchId: fee.matchId,
    corridorId: fee.corridorId,
    timestamp: new Date().toISOString(),
    feeAttribution: [updatedFee],
    withdrawalConfirmed: true,
    deliverySimulated: true,
    fallbackTriggered
  });

  return updatedFee;
}
