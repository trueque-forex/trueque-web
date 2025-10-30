import React, { useEffect, useState } from 'react'
import FeeBreakdown from './FeeBreakdown'
import FallbackNotice from './FallbackNotice'

type Offer = {
  offerAmount: number
  userId: string
  fee?: number
}

type OfferResponse = {
  corridor: { from: string; to: string }
  marketRate: number
  inverseRate: number
  timestamp: string
  source: string
  offers: Offer[]
}

type Props = {
  from: string
  to: string
  debug?: boolean
  onData?: (data: OfferResponse) => void
}

export default function RatePreview({ from, to, debug = false, onData }: Props) {
  const [data, setData] = useState<OfferResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!from || !to) return

    setLoading(true)
    setError(null)

    fetch(`/api/offers?from=${from}&to=${to}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch offers')
        return res.json()
      })
      .then((result: OfferResponse) => {
        setData(result)
        if (onData) onData(result)
        if (debug) console.log('Fetched offers:', result)
      })
      .catch(err => {
        console.error('Error fetching offers:', err)
        setError('Unable to load offers for this corridor.')
      })
      .finally(() => setLoading(false))
  }, [from, to])

  if (loading) return <div className="mt-4 text-sm text-gray-500">Loading rate preview…</div>
  if (error) return <div className="mt-4 text-sm text-red-600">{error}</div>
  if (!data) return null

  return (
    <div className="mt-6 space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Rate Preview</h3>
      <p><strong>Market Rate:</strong> 1 {from} = {data.marketRate.toFixed(4)} {to}</p>
      <p><strong>Inverse Rate:</strong> 1 {to} = {data.inverseRate.toFixed(4)} {from}</p>
      <p><strong>Source:</strong> {data.source}</p>
      <p><strong>Timestamp:</strong> {new Date(data.timestamp).toLocaleString()}</p>

      {data.offers.length === 0 ? (
        <FallbackNotice />
      ) : (
        <FeeBreakdown
          offers={data.offers}
          marketRate={data.marketRate}
          debug={debug}
        />
      )}
    </div>
  )
}	
