// src/pages/api/transactions/submit.ts
import { NextApiRequest, NextApiResponse } from 'next'

// Simple in-memory counter (dev only). Use a DB sequence in production.
let globalCounter = 0

function pad(n: number, width = 6) {
  return String(n).padStart(width, '0')
}

function corridorCode(from = 'XX', to = 'XX') {
  return (from || 'XX').slice(0, 2).toUpperCase()
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Missing token' })

  const body = req.body || {}

  // Accept both old and new field names for compatibility
  const currencyFrom = body.currencyFrom || body.fromCountry || body.currency_from
  const currencyTo = body.currencyTo || body.toCountry || body.currency_to
  const amount = body.amount
  const amountReceived = body.amountReceived || body.amount_received
  const exchangeRate = body.exchangeRate || body.exchange_rate
  const marketRate = body.marketRate || body.market_rate || exchangeRate
  const fee = body.fee || 0
  const feePercentage = body.feePercentage || body.fee_percentage || 1.5
  const counterpartyId = body.counterpartyId || body.counterparty_id
  const paymentMethod = body.paymentMethod || body.payment_method

  // Validate required fields
  if (!currencyFrom || !currencyTo || !amount) {
    return res.status(400).json({ error: 'Missing required fields: currencyFrom, currencyTo, amount' })
  }

  // Generate transaction ID
  globalCounter += 1
  const now = getUtcDate()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  const datePart = `${yyyy}${mm}${dd}`
  const cc = corridorCode(currencyFrom)
  const seq = pad(globalCounter)

  const transactionId = `T${datePart}${cc}${seq}` // e.g. T20251201BR000001
  const createdAt = now.toISOString()

  // Return complete transaction object for mobile app
  return res.status(201).json({
    id: transactionId,
    user_id: 'user_demo', // TODO: Extract from token
    counterparty_id: counterpartyId || null,
    currency_from: currencyFrom,
    currency_to: currencyTo,
    amount: Number(amount),
    amount_received: Number(amountReceived || (amount * exchangeRate)),
    exchange_rate: Number(exchangeRate),
    market_rate: Number(marketRate),
    fee: Number(fee),
    fee_percentage: Number(feePercentage),
    status: 'pending',
    payment_method: paymentMethod || null,
    created_at: createdAt,
    completed_at: null,
    // Legacy fields for web app compatibility
    transactionId,
    estimatedDelivery: null,
  })
}
