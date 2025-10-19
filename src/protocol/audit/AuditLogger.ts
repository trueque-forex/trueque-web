export type MatchAuditEntry = {
  senderId: string;
  receiverId: string;
  corridor: string;
  timestamp: number;
};

export function logMatchAudit(entry: MatchAuditEntry): boolean {
  // In production, this would write to a database or audit log file
  console.log('📘 Match Audit Entry:', entry);
  return true;
}
