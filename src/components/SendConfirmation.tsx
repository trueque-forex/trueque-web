import React, { useMemo, useState } from 'react'
import { Beneficiary } from '../types'

type Props = {
  corridor: string
  amount: string
  rate: number
  sendCurrency: string
  receiveCurrency: string
  fees?: {
    platform?: number
    corridor?: number
    network?: number
  }
  beneficiary: Beneficiary
  onCancel: () => void
  onProceed: (deliverySpeed: string, finalReceive: number) => void
}

export default function SendConfirmation({
  corridor,
  amount,
  rate,
  sendCurrency,
  receiveCurrency,
  fees = {},
  beneficiary,
  onCancel,
  onProceed,
}: Props) {
  const [deliverySpeed, setDeliverySpeed] = useState<'instant' | 'same-day' | '48-hours'>('48-hours')
  const [showFees, setShowFees] = useState(false)

  const sendAmount = parseFloat(amount)

  const deliveryFee = useMemo(() => {
    return deliverySpeed === 'instant' ? 2 : deliverySpeed === 'same-day' ? 1 : 0
  }, [deliverySpeed])

  const totalFees = useMemo(() => {
    return (fees.platform ?? 0) + (fees.corridor ?? 0) + (fees.network ?? 0) + deliveryFee
  }, [fees, deliveryFee])

  const finalReceive = useMemo(() => {
    return sendAmount * rate - totalFees
  }, [sendAmount, rate, totalFees])

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Confirm Transfer</h3>

      <div className="bg-gray-50 p-4 rounded shadow-sm space-y-2">
        <p className="text-sm text-gray-600">📍 Corridor: <strong>{corridor}</strong></p>
<<<<<<< HEAD
        <p className="text-sm text-gray-600">👤 Beneficiary: <strong>{beneficiary.name.replace(/\s*\(.*?\)/, '')}</strong></p>
=======
        <p className="text-sm text-gray-600">👤 Beneficiary: <strong>{(beneficiary.name ?? '').replace(/\s*\(.*?\)/, '')}</strong></p>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
        <p className="text-sm text-gray-600">💰 Amount to Send: <strong>{sendCurrency}{sendAmount.toFixed(2)}</strong></p>

        <label className="text-sm text-gray-600 block mt-4">
          🚚 Delivery Speed:
          <select
            value={deliverySpeed}
            onChange={e => setDeliverySpeed(e.target.value as any)}
            className="ml-2 border rounded px-2 py-1 text-sm"
          >
            <option value="instant">Instant ($2)</option>
            <option value="same-day">Same Day ($1)</option>
            <option value="48-hours">48 Hours ($0)</option>
          </select>
        </label>

        <p className="text-sm text-gray-600 mt-2">
          💸 Total Fees: <strong>{sendCurrency}{totalFees.toFixed(2)}</strong>
          <button
            onClick={() => setShowFees(!showFees)}
            className="ml-4 text-blue-600 underline text-sm"
          >
            {showFees ? 'Hide Breakdown' : 'Show Breakdown'}
          </button>
        </p>

        {showFees && (
          <div className="text-sm text-gray-600 mt-2 space-y-1 ml-2">
            <p>🔧 Platform Fee: {sendCurrency}{(fees.platform ?? 0).toFixed(2)}</p>
            <p>🌐 Corridor Fee: {sendCurrency}{(fees.corridor ?? 0).toFixed(2)}</p>
            <p>📡 Network Fee: {sendCurrency}{(fees.network ?? 0).toFixed(2)}</p>
            <p>🚚 Delivery Fee: {sendCurrency}{deliveryFee.toFixed(2)}</p>
          </div>
        )}

        <p className="text-sm text-gray-600 mt-2">
          💱 Final Receive: <strong>{receiveCurrency}{finalReceive.toFixed(2)}</strong>
          <span className="text-xs italic text-gray-500 ml-2">(After fees)</span>
        </p>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Back
        </button>
        <button
          onClick={() => onProceed(deliverySpeed, finalReceive)}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
