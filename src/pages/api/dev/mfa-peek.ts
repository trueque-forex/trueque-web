import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * DEV ONLY — temporary endpoint to peek at the in-memory MFA store.
 * Returns the current pending MFA code for an email.
 * Delete this file after testing.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(404).end();
    }

    const globalStore = global as any;
    const store: Map<string, { code: string; expires: number }> = globalStore.mfaStore;

    if (!store) {
        return res.status(200).json({ error: 'MFA store not initialized', codes: [] });
    }

    const codes: Record<string, string> = {};
    store.forEach((val, email) => {
        if (Date.now() < val.expires) {
            codes[email] = val.code;
        }
    });

    return res.status(200).json({ codes, count: Object.keys(codes).length });
}
