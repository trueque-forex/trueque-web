import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function SuccessPage() {
  const {
    corridor,
    amount,
    sendCurrency,
    receiveAmount,
    receiveCurrency,
    recipient,
    deliverySpeed,
  } = useRouter().query

  const safe = (val: any, fallback = '—') => (val ? val : fallback)

  const [timestamp, setTimestamp] = useState('')
  const [transactionId, setTransactionId] = useState('')

  useEffect(() => {
    // Generate timestamp and transaction ID on mount
    const now = new Date()
    setTimestamp(now.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }))

    const randomHex = Math.floor(Math.random() * 1e8).toString(16).padStart(8, '0')
    const corridorCode = (corridor || 'XXX').toString().slice(0, 3).toUpperCase()
    setTransactionId(`TX-${corridorCode}-${randomHex}`)
  }, [corridor])

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-green-700">✅ Transaction Sent</h1>

      <div className="bg-green-50 p-4 rounded shadow-sm space-y-2">
        <p><strong>Corridor:</strong> {safe(corridor)}</p>
        <p><strong>Amount Sent:</strong> {safe(amount)} {safe(sendCurrency)}</p>
        <p><strong>Delivery Speed:</strong> {safe(deliverySpeed)}</p>
        <p><strong>Recipient:</strong> {safe(recipient)}</p>
        <p><strong>Final Receive:</strong> {safe(receiveAmount)} {safe(receiveCurrency)}</p>
        <p><strong>Transaction ID:</strong> {transactionId}</p>
        <p><strong>Timestamp:</strong> {timestamp}</p>
      </div>

      <p className="text-sm text-gray-600">
        Your transaction has been successfully submitted.
      </p>

      <button
        onClick={() => window.location.href = '/'}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Send Another Transfer
      </button>
    </main>
  )
}
