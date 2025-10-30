// src/pages/api/test/upsertUser.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { transaction } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') return res.status(404).json({ message: 'Not found' });
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { email, firstName = 'João', lastName = 'Teste', country = 'BR', beneficiary } = req.body || {};
  if (!email) return res.status(400).json({ message: 'email required' });

  try {
    const result = await transaction(async (client: any) => {
      await client.query('DELETE FROM beneficiaries WHERE email = $1', [email]).catch(() => {});
      await client.query('DELETE FROM users WHERE email = $1', [email]).catch(() => {});

      const insertResult = await client.query(
        `INSERT INTO users (first_name, last_name, email, country_of_residence, is_test, created_at)
         VALUES ($1,$2,$3,$4,$5,now())
         RETURNING id`,
        [firstName, lastName, email, country, true]
      );

      let newId: number | string | null = null;
      if (insertResult?.rows?.[0]?.id != null) newId = insertResult.rows[0].id;
      else {
        const sel = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
        newId = sel.rows?.[0]?.id ?? null;
      }
      if (!newId) throw new Error('failed to create user');

      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const tid = `T${date}${country}${String(newId).padStart(4, '0')}-X`;
      await client.query('UPDATE users SET tid = $1 WHERE id = $2', [tid, newId]);

      if (beneficiary && beneficiary.name && beneficiary.account) {
        await client.query(
          `INSERT INTO beneficiaries (user_id, name, account_type, account_identifier, email, created_at)
           VALUES ($1,$2,$3,$4,$5,now())`,
          [newId, beneficiary.name, beneficiary.type || 'bank', beneficiary.account, email]
        );
      }

      return { tid, userId: newId };
    });

    return res.status(201).json(result);
  } catch (err: any) {
    console.error('upsert test user error', err);
    return res.status(500).json({ message: 'failed', detail: err?.message });
  }
}