import React from 'react'

type Offer = {
  offerAmount: number
  userId: string
  fee?: number
}

type Props = {
  offers: Offer[]
  marketRate: number
  debug?: boolean
}

export default function FeeBreakdown({ offers, marketRate, debug = false }: Props) {
  if (!offers || offers.length === 0) {
    return (
      <div className="mt-4 text-sm text-gray-500 italic">
        No offers available for this corridor.
      </div>
    )
  }

  const bestOffer = offers.reduce((min, o) => (o.fee ?? 100) < (min.fee ?? 100) ? o : min)

  const effectiveRate = marketRate * (1 - (bestOffer.fee ?? 0) / 100)
  const totalCost = bestOffer.offerAmount * (1 + (bestOffer.fee ?? 0) / 100)

  if (debug) {
    console.log('Best offer:', bestOffer)
    console.log('Market rate:', marketRate)
    console.log('Effective rate:', effectiveRate)
    console.log('Total cost:', totalCost)
  }

  return (
    <div className="mt-6 border rounded p-4 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Fee Breakdown</h3>
      <p><strong>Best Offer:</strong> {bestOffer.offerAmount} from {bestOffer.userId}</p>
      <p><strong>Fee:</strong> {bestOffer.fee ?? 'N/A'}%</p>
      <p><strong>Effective Rate:</strong> {effectiveRate.toFixed(2)}</p>
      <p><strong>Total Cost:</strong> {totalCost.toFixed(2)}</p>
    </div>
  )
}
