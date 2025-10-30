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
    delivery?: number
  }
  beneficiary: Beneficiary
  payerAccount?: {
    name: string
    accountType: string
    maskedNumber: string
  }
  onBack: () => void
  onConfirm: (
    matchStatus: 'confirmed' | 'pending',
    delivery: string,
    finalReceive: number,
    payer: { name: string; accountType: string; maskedNumber: string }
  ) => void
}

export default function PaymentOptions({
  corridor,
  amount,
  rate,
  sendCurrency,
  receiveCurrency,
  fees = {},
  beneficiary,
  payerAccount,
  onBack,
  onConfirm,
}: Props) {
  const [confirmed, setConfirmed] = useState(false)
  const [useNewMethod, setUseNewMethod] = useState(false)
  const [newAccount, setNewAccount] = useState({
    name: '',
    accountType: 'bank',
    maskedNumber: '',
  })
  const [showTooltip, setShowTooltip] = useState(false)

  const sendAmount = parseFloat(amount)
  const totalFeesUSD = useMemo(() => {
    return (fees.platform ?? 0) + (fees.corridor ?? 0) + (fees.network ?? 0) + (fees.delivery ?? 0)
  }, [fees])

  const finalReceive = useMemo(() => {
    return (sendAmount - totalFeesUSD) / rate
  }, [sendAmount, totalFeesUSD, rate])

  const effectiveRate = useMemo(() => {
    return sendAmount / finalReceive
  }, [sendAmount, finalReceive])

  const feePercent = useMemo(() => {
    return (totalFeesUSD / sendAmount) * 100
  }, [totalFeesUSD, sendAmount])

  const deliverySpeed = 'instant'

  const handleConfirm = () => {
    if (confirmed) {
      const payer = useNewMethod ? newAccount : payerAccount!
      onConfirm('confirmed', deliverySpeed, finalReceive, payer)
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Payment Method</h3>

      <div className="bg-gray-50 p-4 rounded shadow-sm space-y-2">
        <p className="text-sm text-gray-600">📍 Corridor: <strong>{corridor}</strong></p>
<<<<<<< HEAD
        <p className="text-sm text-gray-600">👤 Beneficiary: <strong>{beneficiary.name.replace(/\s*\(.*?\)/, '')}</strong></p>
=======
        <p className="text-sm text-gray-600">👤 Beneficiary: <strong>{(beneficiary.name ?? '').replace(/\s*\(.*?\)/, '')}</strong></p>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
        <p className="text-sm text-gray-600">💰 Amount to Send: <strong>{sendCurrency}{sendAmount.toFixed(2)}</strong></p>
        <p className="text-sm text-gray-600">
          💱 Final Receive: <strong>{receiveCurrency}{finalReceive.toFixed(2)}</strong>
          <span className="text-xs italic text-gray-500 ml-2">(After fees)</span>
        </p>
        <p className="text-sm text-gray-600 relative">
          💱 Effective Exchange Rate: <strong>1 {receiveCurrency} ≈ {effectiveRate.toFixed(2)} {sendCurrency}</strong>
          <span
            className="ml-2 text-blue-600 cursor-pointer"
            onClick={() => setShowTooltip(!showTooltip)}
            title="Click to explain"
          >
            ℹ️
          </span>
          {showTooltip && (
            <div className="absolute bg-white border rounded shadow-md p-2 text-xs text-gray-700 mt-1 w-64 z-10">
              This rate reflects the actual cost after fees.  
              You’re effectively paying <strong>{effectiveRate.toFixed(2)} {sendCurrency}</strong> per <strong>1 {receiveCurrency}</strong>.  
              The difference from the market rate represents a cost increase of <strong>{feePercent.toFixed(1)}%</strong>.
            </div>
          )}
        </p>
        <p className="text-sm text-gray-600">
          💸 Cost Increase (Fees): <strong>{sendCurrency}{totalFeesUSD.toFixed(2)} ({feePercent.toFixed(1)}%)</strong>
        </p>

        {!useNewMethod && payerAccount ? (
          <>
            <p className="text-sm text-gray-600 mt-4">🏦 Payer Account:</p>
            <p className="text-sm text-gray-700 ml-2">
              {payerAccount.name} — {payerAccount.accountType} ••••{payerAccount.maskedNumber}
            </p>
            <button
              onClick={() => setUseNewMethod(true)}
              className="underline text-blue-600 text-sm mt-2"
            >
              Use a different payment method
            </button>
          </>
        ) : (
          <div className="space-y-2 mt-4">
            <label className="text-sm text-gray-600 block">
              Account Holder Name
              <input
                type="text"
                value={newAccount.name}
                onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </label>
            <label className="text-sm text-gray-600 block">
              Account Type
              <select
                value={newAccount.accountType}
                onChange={e => setNewAccount({ ...newAccount, accountType: e.target.value })}
                className="mt-1 block w-full border rounded px-2 py-1"
              >
                <option value="bank">Bank</option>
                <option value="wallet">Wallet</option>
                <option value="card">Card</option>
              </select>
            </label>
            <label className="text-sm text-gray-600 block">
              Account Number
              <input
                type="text"
                value={newAccount.maskedNumber}
                onChange={e => setNewAccount({ ...newAccount, maskedNumber: e.target.value })}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </label>
          </div>
        )}

        <label className="flex items-center space-x-2 text-sm text-gray-600 mt-4">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="form-checkbox"
          />
          <span>I confirm this is my account and I authorize payment.</span>
        </label>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={!confirmed}
          className={`px-4 py-2 rounded ${
            confirmed
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Confirm & Pay
        </button>
      </div>
    </div>
  )
}
