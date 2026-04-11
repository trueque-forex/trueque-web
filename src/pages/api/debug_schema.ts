import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { rows } = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'offers';
        `);
        return res.json({ columns: rows });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}
