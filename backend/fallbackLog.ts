// backend/fallbackLog.ts
export function logFallbackAcknowledgment(userId: string, corridorId: string) {
  return {
    timestamp: new Date().toISOString(),
    userId,
    corridorId,
    acknowledged: true
  };
<<<<<<< HEAD
}
=======
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
