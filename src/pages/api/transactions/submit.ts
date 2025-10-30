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
  // validate payload minimally
  const { fromCountry, toCountry, amount } = body
  if (!fromCountry || !toCountry || !amount) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // production: generate TID atomically in DB (sequence or transaction)
  globalCounter += 1
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  const datePart = `${yyyy}${mm}${dd}`
  const cc = corridorCode(fromCountry)
  const seq = pad(globalCounter)

  const transactionId = `T${datePart}${cc}${seq}` // e.g. T20251017BR000001

  // persist transaction (dev: return minimal object). In prod, insert row and ensure unique index on transactionId.
  const createdAt = now.toISOString()

  return res.status(201).json({
    transactionId,
    createdAt,
    status: 'PENDING',
    estimatedDelivery: null,
  })
}
