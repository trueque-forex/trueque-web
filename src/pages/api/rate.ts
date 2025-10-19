import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { from, to } = req.query

  if (typeof from !== 'string' || typeof to !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid parameters' })
  }

  const mockRates: Record<string, number> = {
    'MX-GT': 0.411,
    'US-MX': 17.2,
    'GT-MX': 0.058,
    'MX-US': 0.058,
    'BR-PT': 0.18,
    'PT-BR': 5.5,
  }

  const key = `${from}-${to}`
  const rate = mockRates[key]

  if (rate) {
    return res.status(200).json({ rate })
  } else {
    return res.status(404).json({ error: 'Rate not found for corridor' })
  }
}
