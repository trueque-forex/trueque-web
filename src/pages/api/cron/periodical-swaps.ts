import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Find all active recurring templates where next_execution_date is today or in the past
    const templatesRes = await query(`
      SELECT * FROM offers 
      WHERE is_recurring = true 
      AND next_execution_date <= NOW()
      AND status = 'OPEN'
    `);
    
    const templates = templatesRes.rows;
    const generated = [];

    for (const template of templates) {
      // 2. Clone the template into a new OPEN instance
      const cloneSql = `
        INSERT INTO offers (
          owner_id, swap_type, amount_offered, currency_offered,
          amount_wanted, currency_wanted, exchange_rate,
          fee_total, fee_details, updated_at, status, is_recurring, destination_id, sweep_eligible, adyen_stored_payment_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'OPEN', false, $10, $11, $12)
        RETURNING *;
      `;
      const cloneRes = await query(cloneSql, [
        template.owner_id, template.swap_type, template.amount_offered, template.currency_offered,
        template.amount_wanted, template.currency_wanted, template.exchange_rate,
        template.fee_total, template.fee_details, template.destination_id, template.sweep_eligible, template.adyen_stored_payment_id
      ]);

      const newOffer = cloneRes.rows[0];
      generated.push(newOffer.id);

      // 3. Bump the template's next_execution_date
      let intervalStr = '1 MONTH';
      if (template.cadence === 'WEEKLY') intervalStr = '1 WEEK';
      else if (template.cadence === 'BI-WEEKLY') intervalStr = '2 WEEKS';

      const updateSql = `
        UPDATE offers
        SET next_execution_date = next_execution_date + INTERVAL '${intervalStr}', updated_at = NOW()
        WHERE id = $1
      `;
      await query(updateSql, [template.id]);
    }

    return res.status(200).json({ success: true, processed: templates.length, generated });
  } catch (err: any) {
    console.error('[cron/periodical-swaps] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
