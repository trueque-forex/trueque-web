import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = (req as any).session as TruequeSession;
  const ownerId = session.user.id;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid offer ID' });
  }

  const { destination_id, adyen_stored_payment_id, status } = req.body;

  try {
    // 1. Verify offer exists and check permissions
    const verifySql = `SELECT id, owner_id, status FROM offers WHERE id = $1;`;
    const verifyResult = await query(verifySql, [id]);

    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const offer = verifyResult.rows[0];
    
    // If caller is not the owner, they can ONLY transition an OPEN offer to MATCHED
    if (offer.owner_id !== ownerId) {
      if (offer.status !== 'OPEN' || status !== 'MATCHED') {
        return res.status(403).json({ error: 'Unauthorized to modify this offer' });
      }
    }

    // 2. Build dynamic update query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (destination_id !== undefined) {
      updates.push(`destination_id = $${paramIndex}`);
      values.push(destination_id);
      paramIndex++;
    }

    if (adyen_stored_payment_id !== undefined) {
      updates.push(`adyen_stored_payment_id = $${paramIndex}`);
      values.push(adyen_stored_payment_id);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    updates.push(`updated_at = NOW()`);

    // Add ID to the end of values for the WHERE clause
    values.push(id);
    
    const updateSql = `
      UPDATE offers
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const result = await query(updateSql, values);
    return res.status(200).json({ success: true, offer: result.rows[0] });

  } catch (err: any) {
    console.error('[offers/update] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

export default withAuth(handler);
