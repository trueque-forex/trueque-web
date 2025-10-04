import { useState } from "react";

type Transaction = {
  tx_id: string;
  gateway: string;
  status: string;
  timestamp: string;
};

type Props = {
  transactions: Transaction[];
};

export default function TransactionHistory({ transactions }: Props) {
  const [filter, setFilter] = useState({
    gateway: "",
    country: "",
  });

  const filtered = transactions.filter((tx) => {
    const matchesGateway = filter.gateway ? tx.gateway === filter.gateway : true;
    const matchesCountry = filter.country ? tx.tx_id.includes(`_${filter.country}`) : true;
    return matchesGateway && matchesCountry;
  });

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Transaction History</h2>

      <div className="flex gap-4 mb-4">
        <select
          onChange={(e) => setFilter((f) => ({ ...f, gateway: e.target.value }))}
          className="p-2 border rounded w-1/2"
        >
          <option value="">All Gateways</option>
          <option value="PIX">PIX</option>
          <option value="SPEI">SPEI</option>
          <option value="VisaDirect">Visa Direct</option>
          <option value="WalletAPI">Wallet</option>
          <option value="Fallback">Fallback</option>
        </select>

        <select
          onChange={(e) => setFilter((f) => ({ ...f, country: e.target.value }))}
          className="p-2 border rounded w-1/2"
        >
          <option value="">All Countries</option>
          <option value="BR">Brazil</option>
          <option value="MX">Mexico</option>
          <option value="US">United States</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No transactions match your filters.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((tx, index) => (
            <li key={index} className="p-3 bg-gray-100 rounded border">
              <div><strong>Gateway:</strong> {tx.gateway}</div>
              <div><strong>Tx ID:</strong> {tx.tx_id}</div>
              <div><strong>Status:</strong> {tx.status}</div>
              <div><strong>Timestamp:</strong> {tx.timestamp}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}