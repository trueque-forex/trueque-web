import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = (req as any).session as TruequeSession;

    // Enforce Admin Role
    if (session?.user?.userType !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { slug } = req.query;
    if (!slug || !Array.isArray(slug)) {
        return res.status(400).json({ error: 'Invalid proxy route' });
    }

    // Build the FastAPI URL
    const path = slug.join('/');
    const fastApiUrl = `http://localhost:8000/api/admin/${path}`;

    try {
        const response = await fetch(fastApiUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'X-Symmetri-Internal-Key': 'SECRET_ADMIN_KEY' // Hardcoded for this patch
            }
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error: any) {
        console.error('FastAPI Proxy Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
}

export default withAuth(handler);
