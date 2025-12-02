// src/components/AuditDashboardSummary.tsx
import React from 'react';

type RawEntry = any;

type Props = {
  entries?: RawEntry[];
  marketRate?: number;
  offers?: RawEntry[];
};

export default function AuditDashboardSummary({ entries, marketRate, offers }: Props) {
  const rows: RawEntry[] = entries ?? (offers as RawEntry[]) ?? [];
  const total = rows.length;
  const verifiedSender = rows.filter((e) => Boolean(e?.sender?.verifiedIdentity)).length;
  const verifiedBeneficiary = rows.filter((e) => Boolean(e?.receiver?.beneficiary?.verifiedOwnership)).length;
  const fallbackCount = rows.filter((e) => Boolean(e?.fallback)).length;

  const corridorCounts: Record<string, number> = rows.reduce((acc: Record<string, number>, e: any) => {
    const c = String(e?.corridor ?? 'unknown');
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  return (
    <section>
      <h2>📊 Audit Summary</h2>
      <p>Total Exchanges: {total}</p>
      <p>✅ Sender Verified: {verifiedSender}</p>
      <p>✅ Beneficiary Verified: {verifiedBeneficiary}</p>
      <p>⚠️ Fallbacks Applied: {fallbackCount}</p>

      <h3>🌐 Corridor Breakdown</h3>
      <ul>
        {Object.entries(corridorCounts).map(([corridor, count]) => (
          <li key={String(corridor)}>
            {String(corridor)}: {count}
          </li>
        ))}
      </ul>
    </section>
  );
}