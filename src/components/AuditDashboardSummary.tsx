export default function AuditDashboardSummary({ entries }) {
  const total = entries.length;
  const verifiedSender = entries.filter(e => e.sender.verifiedIdentity).length;
  const verifiedBeneficiary = entries.filter(e => e.receiver.beneficiary.verifiedOwnership).length;
  const fallbackCount = entries.filter(e => e.fallback).length;

  const corridorCounts = entries.reduce((acc, e) => {
    acc[e.corridor] = (acc[e.corridor] || 0) + 1;
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
          <li key={corridor}>{corridor}: {count}</li>
        ))}
      </ul>
    </section>
  );
}
