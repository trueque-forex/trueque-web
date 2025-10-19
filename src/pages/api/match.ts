import { NextApiRequest, NextApiResponse } from 'next'

type MatchRequest = {
  corridor: string
  amount: number
  paymentMethod: 'SPEI' | 'debit' | 'wallet'
  deliverySpeed: 'instant' | 'same-day'
  beneficiary: {
    country: string
    accountType: 'wallet' | 'bank'
  }
}

type MatchResponse = {
  counterparty: {
    name: string
    country: string
    paymentMethod: string
    deliverySpeed: string
    estimatedReceive: number
    fee: number
    effectiveRate: number
    costIncreasePercent: number
  }
  matchStatus: 'confirmed' | 'pending'
}

export default function handler(req: NextApiRequest, res: NextApiResponse<MatchResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const { corridor, amount, paymentMethod, deliverySpeed, beneficiary }: MatchRequest = req.body

  // Simulate counterparty logic
  const marketRate = 0.411
  const counterpartyFee = paymentMethod === 'debit' ? 2.0 : 1.5
  const estimatedReceive = amount * marketRate
  const finalReceive = estimatedReceive - counterpartyFee
  const effectiveRate = finalReceive / amount
  const costIncreasePercent = Math.abs((effectiveRate - marketRate) / marketRate * 100)

  const counterparty = {
    name: 'Carlos Méndez',
    country: corridor.split('-')[1],
    paymentMethod,
    deliverySpeed,
    estimatedReceive: parseFloat(finalReceive.toFixed(2)),
    fee: counterpartyFee,
    effectiveRate: parseFloat(effectiveRate.toFixed(3)),
    costIncreasePercent: parseFloat(costIncreasePercent.toFixed(2)),
  }

  const matchStatus = 'confirmed'

  res.status(200).json({ counterparty, matchStatus })
}
