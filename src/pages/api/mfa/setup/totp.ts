// src/pages/api/mfa/setup/totp.ts
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Minimal dev-safe TOTP setup endpoint.
 * Replace the stub logic with your real user lookup and TOTP provisioning as needed.
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'method_not_allowed' });
    }

    // TODO: replace this stub with real session/user lookup and TOTP secret generation.
    // The previous file contained an unfinished expression that caused a TypeScript parse error.
    const devResponse = {
      message: 'TOTP setup route (dev stub). Replace with real logic.',
      provisioning_uri: null,
      secret: null,
    };

    return res.status(200).json(devResponse);
  } catch (err) {
    console.error('mfa/setup/totp error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}