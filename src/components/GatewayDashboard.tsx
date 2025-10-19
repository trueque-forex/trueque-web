type Transaction = {
  tx_id: string;
  gateway: string;
  status: string;
  timestamp: string;
};

type Props = {
  transactions: Transaction[];
};

export default function GatewayDashboard({ transactions }: Props) {
  const gateways = Array.from(new Set(transactions.map((tx) => tx.gateway)));

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Gateway Dashboard</h2>

      {gateways.length === 0 ? (
        <p className="text-gray-500">No transactions yet.</p>
      ) : (
        <ul className="space-y-2">
          {gateways.map((gateway, index) => {
            const count = transactions.filter((tx) => tx.gateway === gateway).length;
            const fallbackUsed = gateway === "Fallback";
            return (
              <li key={index} className="p-3 bg-gray-100 rounded border">
                <div><strong>Gateway:</strong> {gateway}</div>
                <div><strong>Usage Count:</strong> {count}</div>
                {fallbackUsed && <div className="text-red-600"><strong>Fallback triggered due to missing or unsupported input</strong></div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
