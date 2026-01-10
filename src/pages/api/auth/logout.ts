import { NextApiRequest, NextApiResponse } from 'next';
import { destroySession } from '../../../lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    await destroySession(req, res);

    // Also clear any client-side specific headers if they exist in future
    res.status(200).json({ ok: true });
}
