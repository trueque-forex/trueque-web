import { useRouter } from 'next/router'
import { useState } from 'react'

export default function EstimatePage() {
  const router = useRouter()
  const { corridor, amount, recipient, userId } = router.query

  const parsedAmount = parseFloat(amount as string) || 0
  const rate = 0.18 // Simulated market rate for BR-PT
  const estimatedReceived = parsedAmount * rate

  const [deliveryMethod, setDeliveryMethod] = useState('bank')
  const [offerDuration, setOfferDuration] = useState('24') // default: 24h
  const [fallbackConsent, setFallbackConsent] = useState(false)
  const [bankInfo, setBankInfo] = useState('maria@pix.com') // Simulated from onboarding

  const handlePostOffer = () => {
    if (!fallbackConsent || !bankInfo) {
      alert('Please confirm fallback consent and bank info.')
      return
    }

    const expirationTimestamp = new Date(Date.now() + parseInt(offerDuration) * 60 * 60 * 1000).toISOString()

    const offer = {
      userId,
      corridor,
      amount: parsedAmount,
      rate,
      estimatedReceived: estimatedReceived.toFixed(2),
      deliveryMethod,
      offerDuration: `${offerDuration}h`,
      fallbackConsent,
      bankInfo,
      postedAt: new Date().toISOString(),
      expiresAt: expirationTimestamp,
    }

    localStorage.setItem('truequeOffer', JSON.stringify(offer))

    router.push({
      pathname: '/match-preview',
      query: {
        corridor,
        amount,
        recipient,
        deliveryMethod,
        rate,
        estimatedReceived: estimatedReceived.toFixed(2),
        expiresAt: expirationTimestamp,
      },
    })
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">📦 Estimate & Offer Posting</h1>

      <div className="bg-gray-50 p-4 rounded shadow-sm space-y-4">
        <p><strong>Amount to Send:</strong> {parsedAmount} BRL</p>

        <p className="text-sm text-gray-700">
          <strong>Estimated Amount to Receive:</strong> EUR {estimatedReceived.toFixed(2)}
          <span className="ml-2 text-xs text-gray-500 italic">
            (Based on current market rate; final rate applied at match)
          </span>
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700">Delivery Method</label>
          <select
            value={deliveryMethod}
            onChange={e => setDeliveryMethod(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value="bank">Bank Deposit</option>
            <option value="cash">Cash Pickup</option>
            <option value="wallet">Mobile Wallet</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Offer Duration</label>
          <select
            value={offerDuration}
            onChange={e => setOfferDuration(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value="1">1 hour</option>
            <option value="6">6 hours</option>
            <option value="12">12 hours</option>
            <option value="24">24 hours</option>
            <option value="48">48 hours</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Your offer will expire after the selected duration if no match is found.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Bank Info for Settlement</label>
          <input
            type="text"
            value={bankInfo}
            onChange={e => setBankInfo(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="Pix key, IBAN, or wallet ID"
          />
        </div>

        <label className="block mt-2">
          <input
            type="checkbox"
            checked={fallbackConsent}
            onChange={e => setFallbackConsent(e.target.checked)}
            className="mr-2"
          />
          I authorize Trueque to close this transaction at market rate using my registered bank info if no match is found.
        </label>

        <p className="text-xs text-gray-600 italic mt-2">
          The higher the number of posted offers like Maria’s, the greater the liquidity in the corridor—accelerating matches and settlement speed.
        </p>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
        >
          ⬅ Back
        </button>
        <button
          onClick={handlePostOffer}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        >
          ✅ Post Offer
        </button>
      </div>
    </main>
  )
}
