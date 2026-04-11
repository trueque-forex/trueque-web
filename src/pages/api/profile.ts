// FILE: src/pages/api/profile.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ authorized: false });

    return res.status(200).json({
      authorized: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name, // Pass name to frontend
        kyc_status: session.user.kycStatus || 'PENDING',
        txCount: session.user.txCount || 0,
        phone: session.user.phone,
        country: session.user.country,
        street_address: session.user.street_address,
        city: session.user.city,
        state: session.user.state,
        postalCode: session.user.postalCode
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error' });
  }
}