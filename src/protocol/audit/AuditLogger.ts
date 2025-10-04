import { appendFileSync } from "fs";
import { getAuditLogPath } from "./LogRotator";
import { MatchAuditEntry } from "./AuditSchema";

export function logMatchAudit(entry: MatchAuditEntry): void {
  const logPath = getAuditLogPath(entry.corridorId);
  const line = JSON.stringify(entry) + "\n";
  appendFileSync(logPath, line);
  console.log(`✅ Match audit written to ${logPath}`);
}