// src/pages/api/auth/signin.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { email, password } = JSON.parse(req.body || '{}');
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    // TODO: validate, set cookie/session
    // Simulate approved KYC for demo purposes
    return res.status(200).json({ kycStatus: 'approved' });
  } catch (e: any) {
    return res.status(500).json({ error: 'internal_error' });
  }
}