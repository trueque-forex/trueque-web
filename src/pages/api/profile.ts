import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../lib/withAuth';
import knexClient from '../../lib/knexClient';
import { TruequeSession } from '../../types/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = (req as any).session as TruequeSession;
    console.log('[DEBUG-PROFILE] req.url:', req.url);
    console.log('[DEBUG-PROFILE] Session result:', session.user.email);

    // Return profile data from session
    // NOTE: TruequeSession is minimal (id, email, kyc). We must hydrate the rest from DB.
    const responseData = {
      // Common fields
      id: session.user.id,
      email: session.user.email,
      name: 'User', // Placeholder, verified by DB below
      firstName: '',
      lastName: '',
      kycStatus: (session.user.kycStatus || 'none').toUpperCase(),
      txCount: 0,

      // Mobile/Legacy compat
      // id: session.user.id, // Redundant now
      first_name: '',
      last_name: '',
      created_at: new Date().toISOString(), // Approximation
    };

    // HYDRATE FROM DB (Single Source of Truth)
    try {
      const dbUser = await knexClient('users').where({ email: session.user.email }).first();
      if (dbUser) {
        console.log(`[PROFILE] Hydrated from DB: ${dbUser.email} -> ${dbUser.kyc_status?.toUpperCase()}`);
        responseData.kycStatus = (dbUser.kyc_status || 'none').toUpperCase();
        responseData.txCount = dbUser.tx_count || responseData.txCount;

        // Name Hydration
        responseData.firstName = dbUser.first_name || dbUser.full_name?.split(' ')[0] || 'User';
        responseData.lastName = dbUser.last_name || dbUser.full_name?.split(' ').slice(1).join(' ') || '';
        responseData.name = dbUser.full_name || `${responseData.firstName} ${responseData.lastName}`.trim();

        // Sync Legacy fields
        responseData.first_name = responseData.firstName;
        responseData.last_name = responseData.lastName;
        responseData.created_at = dbUser.created_at || responseData.created_at;

        // Also update ID if missing in session (Robustness)
        if (!responseData.id && dbUser.id) responseData.id = dbUser.id;
      }
    } catch (dbErr) {
      console.warn('[PROFILE] Failed to hydrate from DB', dbErr);
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withAuth(handler);
