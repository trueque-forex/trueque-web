// FILE: src/pages/api/debug-session-endpoint.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const g = global as any;
  const sessionMap = g.__SESS_MAP as Map<string, string> || new Map();
  
  res.status(200).json({
    count: sessionMap.size,
    keys: Array.from(sessionMap.keys())
  });
}