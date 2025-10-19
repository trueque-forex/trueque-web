// src/pages/api/some.ts
import { getPool } from '@/lib/db';

export default async function handler(req, res) {
  const pool = getPool();
  const { rows } = await pool.query('SELECT 1');
  res.json(rows);
}