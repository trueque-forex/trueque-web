import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const session = await getSession(req);

        if (!session) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Return profile data from session
        // Matching structure expected by mobile app if possible
        return res.status(200).json({
            id: session.userId,
            trueque_id: session.truequeId || undefined,
            email: session.email,
            first_name: session.firstName,
            last_name: session.lastName,
            // Add other fields if available in session
        });
    } catch (error) {
        console.error('User Profile API error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
