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
    console.log(`[CACHE HIT] ${key} = ${cache[key].rate.toFixed(3)} @ ${new Date(cache[key].timestamp).toISOString()}`)
    return res.status(200).json({ rate: cache[key].rate.toFixed(3), readable: cache[key].readable })
  }

  const appId = process.env.OPENEXCHANGE_API_KEY
  if (!appId) {
    return res.status(500).json({ error: 'Missing OpenExchangeRates API key' })
  }

  try {
    const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${appId}`)
    const data = await response.json()
    const usdRates = data?.rates

    if (!usdRates?.[from] || !usdRates?.[to]) {
      console.warn(`[RATE MISSING] ${from} or ${to} not found in USD rates`)
      return res.status(404).json({ error: `Rate not available for ${from} → ${to}` })
    }

    const rate = (1 / usdRates[from]) * usdRates[to]
    const readable = rate < 0.2
      ? `1 ${to} ≈ ${(1 / rate).toFixed(2)} ${from}`
      : `1 ${from} ≈ ${rate.toFixed(3)} ${to}`

    cache[key] = { rate, readable, timestamp: now }

    console.log(`[RATE] ${from} → ${to} = ${rate.toFixed(3)} @ ${new Date().toISOString()}`)
    res.status(200).json({ rate: rate.toFixed(3), readable })
  } catch (err) {
    console.error(`[ERROR] Rate fetch failed for ${key}:`, err)
    res.status(500).json({ error: 'Failed to fetch exchange rate' })
  }
}