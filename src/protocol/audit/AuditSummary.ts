import { readFileSync } from "fs";
import { join } from "path";
import { MatchAuditEntry } from "./AuditSchema";

const logPath = join(process.cwd(), "trueque-web", "src", "protocol", "audit", "match_audit_MX-US_2025-10-04.log");
const log = readFileSync(logPath, "utf-8");

const lines = log.trim().split("\n");

type CorridorStats = {
  total: number;
  breaches: number;
  fallbacks: number;
  feeAttribution: Record<string, number>;
  breachTypes: Record<string, number>;
};

const statsByCorridor: Record<string, CorridorStats> = {};

function validateAuditEntry(entry: any): entry is MatchAuditEntry {
  return (
    typeof entry.matchId === "string" &&
    typeof entry.corridorId === "string" &&
    Array.isArray(entry.breachFlags) &&
    typeof entry.fallbackUsed === "boolean" &&
    typeof entry.feeAttribution === "string" &&
    typeof entry.timestamp === "string"
  );
}

for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    if (!validateAuditEntry(entry)) continue;

    const corridor = entry.corridorId;
    if (!statsByCorridor[corridor]) {
      statsByCorridor[corridor] = {
        total: 0,
        breaches: 0,
        fallbacks: 0,
        feeAttribution: {},
        breachTypes: {},
      };
    }

    const stats = statsByCorridor[corridor];
    stats.total++;
    if (entry.breachFlags.length > 0) {
      stats.breaches++;
      for (const flag of entry.breachFlags) {
        stats.breachTypes[flag] = (stats.breachTypes[flag] || 0) + 1;
      }
    }
    if (entry.fallbackUsed) stats.fallbacks++;
    stats.feeAttribution[entry.feeAttribution] = (stats.feeAttribution[entry.feeAttribution] || 0) + 1;
  } catch {
    continue;
  }
}

for (const [corridor, stats] of Object.entries(statsByCorridor)) {
  console.log(`\n📊 Audit Summary for ${corridor}`);
  console.log(`Total Matches: ${stats.total}`);
  console.log(`SLA Breaches: ${stats.breaches}`);
  console.log(`Fallbacks Triggered: ${stats.fallbacks}`);
  console.log(`Fee Attribution:`);
  for (const [type, count] of Object.entries(stats.feeAttribution)) {
    console.log(`  - ${type}: ${count}`);
  }
  console.log(`Breach Types:`);
  for (const [flag, count] of Object.entries(stats.breachTypes)) {
    console.log(`  - ${flag}: ${count}`);
  }
}