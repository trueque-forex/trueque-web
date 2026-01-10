import { NextApiRequest, NextApiResponse } from 'next'

type MatchRequest = {
  corridor: string
  amount: number
  paymentMethod: 'SPEI' | 'debit' | 'wallet'
  deliverySpeed: 'instant' | 'same-day' | 'standard'
  beneficiary: {
    country: string
    accountType: 'wallet' | 'bank'
  }
}

type MatchResponse = {
  counterparty: {
    name?: string
    country?: string
    paymentMethod?: string
    deliverySpeed?: string
    estimatedReceive?: number
    fee?: number
    effectiveRate?: number
    market_rate_used?: number
    costIncreasePercent?: number
  }
  matchStatus: 'confirmed' | 'pending' | 'quote'
}

export default function handler(req: NextApiRequest, res: NextApiResponse<MatchResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  // Handle Mobile App Payload (uuid based)
  if (req.body.uuid && req.body.counterparty_uuid) {
    // Mock response for mobile flow
    return res.status(200).json({
      market_rate_used: 4000.0,
      rate_source: 'Reuters',
      rate_fallback: 'Mid-market',
      timestamp: new Date().toISOString(),
      status: 'confirmed',
      counterparty: {
        name: 'Carlos Méndez',
        country: 'MX',
        trueque_id: 'TRQ-MX-123',
        kyc_verified: true
      }
    } as any);
  }

  const { corridor, amount, paymentMethod, deliverySpeed }: MatchRequest = req.body

  // Mock Market Rates
  const rates: Record<string, number> = {
    'USD-MXN': 17.50,
    'MXN-USD': 0.057,
    'EUR-USD': 1.08,
    'USD-EUR': 0.92,
    'COP-USD': 0.00025,
    'USD-COP': 4000.0
  }

  const marketRate = rates[corridor] || 1.0

  // If just checking rate (amount small or specific flag), return quote
  if (amount <= 1) {
    return res.status(200).json({
      counterparty: {
        market_rate_used: marketRate,
        effectiveRate: marketRate // Approx for quote
      },
      matchStatus: 'quote'
    })
  }

  const counterpartyFee = paymentMethod === 'debit' ? 2.0 : 1.5
  const estimatedReceive = amount * marketRate
  const finalReceive = estimatedReceive - counterpartyFee
  const effectiveRate = finalReceive / amount
  const costIncreasePercent = Math.abs((effectiveRate - marketRate) / marketRate * 100)

  const counterparty = {
    name: 'Carlos Méndez',
    country: corridor.split('-')[1] || 'Unknown',
    paymentMethod,
    deliverySpeed,
    estimatedReceive: parseFloat(finalReceive.toFixed(2)),
    fee: counterpartyFee,
    effectiveRate: parseFloat(effectiveRate.toFixed(3)),
    market_rate_used: marketRate,
    costIncreasePercent: parseFloat(costIncreasePercent.toFixed(2)),
  }

  const matchStatus = 'confirmed'

  res.status(200).json({ counterparty, matchStatus })
}
