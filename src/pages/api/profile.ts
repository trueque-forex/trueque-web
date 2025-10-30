import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple mock profile that reads Authorization header token and returns needsKYC for certain tokens
  const auth = req.headers.authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')

  if (!token) {
    return res.status(401).json({ error: 'Missing token' })
  }

  // For demo: tokens containing "kyc" require KYC
  const needsKYC = token.includes('kyc')

  return res.status(200).json({
    userId: `user_demo`,
    email: 'demo@example.com',
    name: 'Demo User',
    needsKYC,
  })
}
