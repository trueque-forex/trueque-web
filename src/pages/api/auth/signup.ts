// src/pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { email, password } = JSON.parse(req.body || '{}');
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    // TODO: create user, set cookie/session here
    // Simulate: new users need KYC review
    return res.status(201).json({ needsKyc: true, kycStatus: 'pending' });
  } catch (e: any) {
    return res.status(500).json({ error: 'internal_error' });
  }
}