// src/pages/api/_debug_sessions.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // simple debug endpoint
  res.status(200).json({ ok: true, method: req.method });
}