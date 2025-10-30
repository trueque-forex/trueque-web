import type { NextApiRequest, NextApiResponse } from 'next'

type RefreshResponse = {
  token?: string
  timestamp?: string
  error?: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse<RefreshResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { token } = req.body

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid token' })
  }

  try {
    // Simulate decoding and refreshing (replace with real logic)
    const decoded = atob(token)
    const userId = decoded.split(':')[0] || 'unknown'

    const newToken = btoa(`${userId}:${Math.random().toString(36).slice(2, 10)}`)
    const timestamp = new Date().toISOString()

    return res.status(200).json({ token: newToken, timestamp })
  } catch (err) {
    return res.status(500).json({ error: 'Token refresh failed' })
  }
}
