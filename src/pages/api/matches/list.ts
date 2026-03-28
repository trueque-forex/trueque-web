import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user_id = req.query.user_id as string;
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

  try {
    const sql = `
      SELECT 
        m.id,
        m.created_at,
        m.status,
        m.maker_confirmed,
        m.taker_confirmed,
        
        -- Did *I* verify payment?
        CASE 
          WHEN o.user_id = $1 THEN m.maker_confirmed
          ELSE m.taker_confirmed
        END as i_have_confirmed,

        -- Did *THEY* verify payment?
        CASE 
          WHEN o.user_id = $1 THEN m.taker_confirmed
          ELSE m.maker_confirmed
        END as peer_has_confirmed,

        CASE 
          WHEN o.user_id = $1 THEN o.currency_offered 
          ELSE o.currency_wanted                      
        END as sent_currency,

        CASE 
          WHEN o.user_id = $1 THEN m.final_amount_offered
          ELSE m.final_amount_wanted
        END as sent_amount,

        CASE 
          WHEN o.user_id = $1 THEN o.currency_wanted  
          ELSE o.currency_offered                     
        END as received_currency,

        CASE 
          WHEN o.user_id = $1 THEN m.final_amount_wanted
          ELSE m.final_amount_offered
        END as received_amount

      FROM matches m
      JOIN offers o ON m.offer_id = o.id
      WHERE o.user_id = $1 OR m.taker_id = $1
      ORDER BY m.created_at DESC;
    `;

    const result = await query(sql, [user_id]);
    return res.status(200).json({ success: true, swaps: result.rows });

  } catch (err: any) {
    console.error('Swap List Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}