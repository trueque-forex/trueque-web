export interface MatchAuditEntry {
  matchId: string;
  corridorId: string;
  breachFlags: string[];
  fallbackUsed: boolean;
  feeAttribution: string;
  timestamp: string;
}
