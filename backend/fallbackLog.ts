// backend/fallbackLog.ts
export function logFallbackAcknowledgment(userId: string, corridorId: string) {
  return {
    timestamp: new Date().toISOString(),
    userId,
    corridorId,
    acknowledged: true
  };
}