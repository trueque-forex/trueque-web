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
  deliveryOptions: { speed: string; label: string; fee: number }[]
  beneficiary: Beneficiary
  onCancel: () => void
  onProceed: (deliverySpeed: string, finalReceive: number) => void
}

export default function ConfirmTransfer({
  corridor,
  amount,
  rate,
  sendCurrency,
  receiveCurrency,
  fees = {},
  deliveryOptions,
  beneficiary,
  onCancel,
  onProceed,
}: Props) {
  const [deliverySpeed, setDeliverySpeed] = useState<string>(
    deliveryOptions[0]?.speed || '48-hours'
  )
  const [showFees, setShowFees] = useState(false)

  const sendAmount = parseFloat(amount)

  const deliveryFee = useMemo(() => {
    return deliveryOptions.find(opt => opt.speed === deliverySpeed)?.fee ?? 0
  }, [deliverySpeed, deliveryOptions])

  const totalFeesUSD = useMemo(() => {
    return (
      (fees.platform ?? 0) +
      (fees.corridor ?? 0) +
      (fees.network ?? 0) +
      deliveryFee
    )
  }, [fees, deliveryFee])

  const finalReceive = useMemo(() => {
    return (sendAmount - totalFeesUSD) / rate
  }, [sendAmount, totalFeesUSD, rate])

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Confirm Transfer</h3>

      <div className="bg-gray-50 p-4 rounded shadow-sm space-y-2">
        <p className="text-sm text-gray-600">
          📍 Corridor: <strong>{corridor}</strong>
        </p>
        <p className="text-sm text-gray-600">
          👤 Beneficiary:{' '}
<<<<<<< HEAD
          <strong>{beneficiary.name.replace(/\s*\(.*?\)/, '')}</strong>
=======
          <strong>{(beneficiary.name ?? '').replace(/\s*\(.*?\)/, '')}</strong>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
        </p>
        <p className="text-sm text-gray-600">
          💰 Amount to Send:{' '}
          <strong>
            {sendCurrency}
            {sendAmount.toFixed(2)}
          </strong>
        </p>

        <label className="text-sm text-gray-600 block mt-4">
          🚚 Delivery Speed:
          <select
            value={deliverySpeed}
            onChange={e => setDeliverySpeed(e.target.value)}
            className="ml-2 border rounded px-2 py-1 text-sm"
          >
            {deliveryOptions.map(opt => (
              <option key={opt.speed} value={opt.speed}>
                {opt.label} (${opt.fee})
              </option>
            ))}
          </select>
        </label>

        <p className="text-sm text-gray-600 mt-2">
          💸 Total Fees:{' '}
          <strong>
            {sendCurrency}
            {totalFeesUSD.toFixed(2)}
          </strong>
          <button
            onClick={() => setShowFees(!showFees)}
            className="ml-4 text-blue-600 underline text-sm"
          >
            {showFees ? 'Hide Breakdown' : 'Show Breakdown'}
          </button>
        </p>

        {showFees && (
          <div className="text-sm text-gray-600 mt-2 space-y-1 ml-2">
            <p>
              🔧 Platform Fee: {sendCurrency}
              {(fees.platform ?? 0).toFixed(2)}
            </p>
            <p>
              🌐 Corridor Fee: {sendCurrency}
              {(fees.corridor ?? 0).toFixed(2)}
            </p>
            <p>
              📡 Network Fee: {sendCurrency}
              {(fees.network ?? 0).toFixed(2)}
            </p>
            <p>
              🚚 Delivery Fee: {sendCurrency}
              {deliveryFee.toFixed(2)}
            </p>
          </div>
        )}

        <p className="text-sm text-gray-600 mt-2">
          💱 Final Receive:{' '}
          <strong>
            {receiveCurrency}
            {finalReceive.toFixed(2)}
          </strong>
          <span className="text-xs italic text-gray-500 ml-2">
            (After fees)
          </span>
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
