type Recipient = {
  country: string;
  type: string;
};

export default function RoutingFlow({ country, type }: Recipient) {
  const gatewayMap: Record<string, Record<string, string>> = {
    BR: { bank: "PIX" },
    MX: { bank: "SPEI" },
    US: { debit_card: "VisaDirect", wallet: "WalletAPI" },
  };

  const gateway = gatewayMap[country]?.[type] || "Fallback";

  return (
    <div className="max-w-md mx-auto mt-6 p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Routing Logic</h3>
      <div className="space-y-2 text-sm">
        <div>🌍 <strong>Country:</strong> {country}</div>
        <div>🏦 <strong>Type:</strong> {type}</div>
        <div>🚀 <strong>Selected Gateway:</strong> {gateway}</div>
        {gateway === "Fallback" && (
          <div className="text-red-600">⚠️ Fallback triggered due to unsupported combination</div>
        )}
      </div>
    </div>
  );
}
