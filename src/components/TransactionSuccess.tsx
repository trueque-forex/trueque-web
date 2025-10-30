import React from 'react'

type Props = {
  corridor: string
  amount: string
  rate: number
  sendCurrency: string
  receiveCurrency: string
  fees: {
    platform: number
    corridor: number
    network: number
    delivery: number
  }
  deliverySpeed: 'instant' | 'same-day' | '48-hours'
  beneficiary: {
    name: string
  }
  onClose: () => void
}

export default function TransactionSuccess({
  corridor,
  amount,
  rate,
  sendCurrency,
  receiveCurrency,
  fees,
  deliverySpeed,
  beneficiary,
  onClose,
}: Props) {
  const sendAmount = parseFloat(amount)
  const totalFees = fees.platform + fees.corridor + fees.network + fees.delivery
  const finalReceive = sendAmount * rate - totalFees

  const deliveryNote =
    deliverySpeed === 'instant'
      ? 'Beneficiary will receive the funds in minutes.'
      : deliverySpeed === 'same-day'
      ? 'Beneficiary will receive the funds during the day.'
      : 'Beneficiary will receive the funds in 48 hours.'

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-green-700">Transaction Successful</h3>

      <div className="bg-gray-50 p-4 rounded shadow-sm space-y-2">
        <p className="text-sm text-gray-600">📍 Corridor: <strong>{corridor}</strong></p>
        <p className="text-sm text-gray-600">👤 Beneficiary: <strong>{beneficiary.name}</strong></p>
        <p className="text-sm text-gray-600">💰 Amount Sent: <strong>{sendCurrency}{sendAmount.toFixed(2)}</strong></p>
        <p className="text-sm text-gray-600">💱 Final Received: <strong>{receiveCurrency}{finalReceive.toFixed(2)}</strong></p>
        <p className="text-sm text-gray-600">💱 Effective Exchange Rate: <strong>1 {sendCurrency} ≈ {rate.toFixed(2)} {receiveCurrency}</strong></p>
        <p className="text-sm text-gray-600">💸 Cost Increase (Fees): <strong>{sendCurrency}{totalFees.toFixed(2)}</strong></p>

        <p className="text-sm text-gray-600">🚚 Delivery Speed: <strong>{deliverySpeed}</strong></p>
        <p className="text-xs italic text-gray-500">{deliveryNote}</p>

        <p className="text-sm text-gray-600 mt-4">📍 Status: <strong>Processing</strong></p>
        <p className="text-xs text-gray-500">We’ll keep you and the beneficiary informed as the funds move through the system.</p>
      </div>

      <button
        onClick={onClose}
        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
      >
        Done
      </button>
    </div>
  )
}
