import { join } from "path";

// Force logs to land in the source audit folder
export function getAuditLogPath(corridorId: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const filename = `match_audit_${corridorId}_${date}.log`;

  // Use project-relative path instead of __dirname
  return join(process.cwd(), "trueque-web", "src", "protocol", "audit", filename);
}