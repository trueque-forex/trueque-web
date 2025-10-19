type Props = {
  corridor: string
  amount: string
  rate: number
  finalReceive: number
  deliverySpeed: string
  beneficiary: {
    name: string
    country: string
    accountType: string
  }
}

export default function TransactionFinalized({
  corridor,
  amount,
  rate,
  finalReceive,
  deliverySpeed,
  beneficiary,
}: Props) {
  const origin = corridor.split('-')[0]
  const destination = corridor.split('-')[1]

  return (
    <div className="mt-6 border rounded p-4 bg-white shadow-sm text-sm">
      <h2 className="font-semibold text-green-700 mb-2">✅ Transaction Finalized</h2>

      <ul className="space-y-1">
        <li><strong>Corridor:</strong> {corridor}</li>
        <li><strong>Amount Sent:</strong> {amount} {origin}</li>
        <li><strong>Market Rate:</strong> 1 {origin} ≈ {rate.toFixed(3)} {destination}</li>
        <li><strong>Final Receive:</strong> {finalReceive.toFixed(2)} {destination}</li>
        <li><strong>Delivery Speed:</strong> {deliverySpeed}</li>
        <li><strong>Beneficiary:</strong> {beneficiary.name} ({beneficiary.country}) — {beneficiary.accountType}</li>
      </ul>

      <p className="mt-4 text-sm text-gray-600">
        🎉 Your transaction has been matched and is now in progress. Your beneficiary will receive the funds via {deliverySpeed} delivery.
      </p>
    </div>
  )
}
