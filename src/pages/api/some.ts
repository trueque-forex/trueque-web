// src/pages/api/some.ts
<<<<<<< HEAD
import { getPool } from '@/lib/db';

export default async function handler(req, res) {
  const pool = getPool();
  const { rows } = await pool.query('SELECT 1');
  res.json(rows);
=======
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pool = getPool();
  try {
    const { rows } = await pool.query('SELECT 1 as ok');
    return res.status(200).json({ ok: true, rows });
  } catch (err: any) {
    console.error('some api error', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
}