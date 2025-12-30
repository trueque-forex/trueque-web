// src/pages/api/beneficiaries/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/server/db';
import jwt from 'jsonwebtoken';

type Beneficiary = {
  id: string;
  user_id: string;
  name?: string | null;
  country?: string | null;
  method: string;
  identifiers: Record<string, unknown>;
  status: 'pending_screening' | 'approved' | 'review_required' | 'blocked' | 'archived';
  risk_tier?: 'low' | 'medium' | 'high' | null;
  last_screened_at?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

function requireAuth(req: NextApiRequest) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.split(' ')[1];
  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    const decoded = jwt.verify(token, secret) as { userId: string };
    return { userId: decoded.userId };
  } catch (e) {
    console.error('Token verification failed:', e);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const actor = requireAuth(req);
  if (!actor) return res.status(401).json({ error: 'Unauthorized' });

  // POST: Create new beneficiary
  if (req.method === 'POST') {
    const body = req.body;
    if (!body || !body.method || !body.identifiers) {
      return res.status(400).json({ error: 'method and identifiers required' });
    }

    const now = new Date().toISOString();
    const userId = parseInt(actor.userId, 10);

    const metadata = {
      method: body.method,
      identifiers: body.identifiers,
      country: body.country || 'US'
    };

    // Serialize metadata to avoid [object Object] in text columns
    const metadataJson = JSON.stringify(metadata);

    const insertText = `
      INSERT INTO beneficiaries
        (owner_id, name, metadata, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      userId,
      body.name || 'Unknown',
      metadataJson,
      now,
    ];

    try {
      const { rows } = await query(insertText, values);
      const row = rows[0];

      const md = row.metadata || {};
      // Handle case where metadata comes back as string (if driver didn't parse JSON)
      const parsedMd = typeof md === 'string' ? JSON.parse(md) : md;

      return res.status(201).json({
        id: String(row.id),
        user_id: String(row.owner_id),
        name: row.name,
        country: parsedMd.country || 'US',
        method: parsedMd.method || 'unknown',
        identifiers: parsedMd.identifiers || {},
        status: 'approved',
        created_at: row.created_at
      });
    } catch (e: any) {
      console.error('beneficiaries.POST error', e);
      return res.status(500).json({ error: 'internal_error' });
    }
  }

  // GET: List beneficiaries
  if (req.method === 'GET') {
    const userId = parseInt(actor.userId, 10);
    const { method } = req.query;

    const selectText = `
        SELECT * FROM beneficiaries 
        WHERE owner_id = $1 
        ORDER BY created_at DESC
    `;

    try {
      const { rows } = await query(selectText, [userId]);

      const mappedRows = rows.map((row: any) => {
        let md = row.metadata || {};
        if (typeof md === 'string') {
          try { md = JSON.parse(md); } catch (e) { }
        }

        if (method && md.method !== method) return null;

        return {
          id: String(row.id),
          user_id: String(row.owner_id),
          name: row.name,
          country: md.country || 'US',
          method: md.method || 'unknown',
          identifiers: md.identifiers || {},
          status: 'approved',
          created_at: row.created_at
        };
      }).filter(Boolean);

      return res.status(200).json(mappedRows);
    } catch (e: any) {
      console.error('beneficiaries.GET error', e);
      return res.status(500).json({ error: 'internal_error' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).end();
}