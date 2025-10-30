<<<<<<< HEAD
export default function AuditDashboardSummary({ entries }) {
  const total = entries.length;
  const verifiedSender = entries.filter(e => e.sender.verifiedIdentity).length;
  const verifiedBeneficiary = entries.filter(e => e.receiver.beneficiary.verifiedOwnership).length;
  const fallbackCount = entries.filter(e => e.fallback).length;

  const corridorCounts = entries.reduce((acc, e) => {
    acc[e.corridor] = (acc[e.corridor] || 0) + 1;
    return acc;
  }, {});
=======
// src/components/AuditDashboardSummary.tsx
type Entry = any

export default function AuditDashboardSummary({
  // accept either explicit entries or the parent 'offers' shortform
  entries,
  marketRate,
  offers
}: {
  entries?: Entry[]
  marketRate?: number
  offers?: any[]
}) {
  const rows: Entry[] = entries ?? (offers as Entry[]) ?? []
  const total = rows.length
  const verifiedSender = rows.filter((e: any) => e?.sender?.verifiedIdentity).length
  const verifiedBeneficiary = rows.filter((e: any) => e?.receiver?.beneficiary?.verifiedOwnership).length
  const fallbackCount = rows.filter((e: any) => e?.fallback).length

  const corridorCounts: Record<string, number> = rows.reduce((acc: Record<string, number>, e: any) => {
    const c = String(e?.corridor ?? 'unknown')
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {})
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

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
<<<<<<< HEAD
          <li key={corridor}>{corridor}: {count}</li>
        ))}
      </ul>
    </section>
  );
}
=======
          <li key={String(corridor)}>{String(corridor)}: {count}</li>
        ))}
      </ul>
    </section>
  )
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
