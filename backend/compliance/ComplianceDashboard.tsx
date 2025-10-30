type Transaction = {
  tx_id: string;
  gateway: string;
  status: string;
  timestamp: string;
  recipient?: string;
  relationship?: string;
};

type Props = {
  transactions: Transaction[];
};

export default function ComplianceDashboard({ transactions }: Props) {
  const getTotals = () => {
    const now = new Date();
    const monthlyCutoff = new Date(now);
    monthlyCutoff.setDate(now.getDate() - 30);
    const sixMonthCutoff = new Date(now);
    sixMonthCutoff.setDate(now.getDate() - 180);

    let monthlyTotal = 0;
    let sixMonthTotal = 0;

    for (const tx of transactions) {
      const txTime = new Date(tx.timestamp);
      const amount = 250; // Replace with actual amount logic

      if (txTime > monthlyCutoff) monthlyTotal += amount;
      if (txTime > sixMonthCutoff) sixMonthTotal += amount;
    }

    return { monthlyTotal, sixMonthTotal };
  };

  const { monthlyTotal, sixMonthTotal } = getTotals();

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Compliance Dashboard</h2>

      <div className="mb-4">
        <strong>Monthly Total:</strong> ${monthlyTotal.toFixed(2)} / $3,000
        {monthlyTotal >= 3000 && <span className="text-red-600 ml-2">⚠️ Limit Exceeded</span>}
      </div>

      <div className="mb-4">
        <strong>Six-Month Total:</strong> ${sixMonthTotal.toFixed(2)} / $6,000
        {sixMonthTotal >= 6000 && <span className="text-red-600 ml-2">⚠️ Limit Exceeded</span>}
      </div>

      <h3 className="font-semibold mt-6 mb-2">Audit Log</h3>
      <ul className="space-y-2 text-sm">
        {transactions.map((tx, i) => (
          <li key={i} className="p-3 bg-gray-100 rounded border">
            <div><strong>Timestamp:</strong> {tx.timestamp}</div>
            <div><strong>Gateway:</strong> {tx.gateway}</div>
            <div><strong>Recipient:</strong> {tx.recipient} ({tx.relationship})</div>
            <div><strong>Status:</strong> {tx.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
