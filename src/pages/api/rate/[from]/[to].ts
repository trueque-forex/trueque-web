import { NextApiRequest, NextApiResponse } from 'next'

const cache: Record<string, { rate: number; readable: string; timestamp: number }> = {}
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { from, to } = req.query

  if (typeof from !== 'string' || typeof to !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid currency codes' })
  }

  const key = `${from}-${to}`
  const now = Date.now()

  // Serve from cache if fresh
  if (cache[key] && now - cache[key].timestamp < CACHE_DURATION) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CACHE HIT] ${key} = ${cache[key].rate.toFixed(4)}`)
    }
    return res.status(200).json({ rate: cache[key].rate.toFixed(4), readable: cache[key].readable })
  }

  // PYTHON BACKEND URL (Consensus Engine)
  // MUST point to Python port 8000, ignoring frontend NEXT_PUBLIC_API_URL
  const backendUrl = 'http://127.0.0.1:8000';

  try {
    // Call Python Microservice (Truth Rate)
    // Call Python Microservice (Truth Rate)
    const response = await fetch(`${backendUrl}/api/quotes/rate?from_currency=${from}&to_currency=${to}`)

    if (!response.ok) {
      throw new Error(`Backend Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json()

    // Expecting: { rate: float, is_unstable: bool, ... }
    const rate = Number(data.rate);

    if (isNaN(rate)) throw new Error('Invalid rate received from backend');

    const readable = rate < 0.2
      ? `1 ${to} ≈ ${(1 / rate).toFixed(2)} ${from}`
      : `1 ${from} ≈ ${rate.toFixed(4)} ${to}`

    cache[key] = { rate, readable, timestamp: now }

    console.log(`[FX CONSUMER] ${from} → ${to} = ${rate.toFixed(4)} (Source: ${data.engine || 'Backend'})`)
    res.status(200).json({ rate: rate.toFixed(4), readable })

  } catch (err: any) {
    console.error(`[ERROR] Rate fetch failed for ${key} using URL ${backendUrl}/api/quotes/rate?from_currency=${from}&to_currency=${to}:`, err.message)
    res.status(502).json({ error: 'Exchange Rate Service Unavailable', details: err.message, url: `${backendUrl}/api/quotes/rate` })
  }
}