// src/server/kyc/issueSymmetriId.ts
import { db } from '../db';
import { generateSymmetriId } from './generateSymmetriId';

console.error('🧪 [TruequeIssuer] module loaded:', __filename, 'pid=', process.pid);

export async function issueSymmetriId(userId: string, countryCode: string): Promise<{ trade_mask_sid: string }> {
  console.error('🧪 [TruequeIssuer] enter:', userId, 'pid=', process.pid, 'time=', new Date().toISOString());

  const now = new Date();

  // db is a function that returns a pg Pool
  const pool = typeof db === 'function' ? db() : (db as any);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
    const user = userRes.rows[0];

    if (!user) {
      await client.query('ROLLBACK');
      throw new Error(`User not found: ${userId}`);
    }
    if (user.tid) {
      await client.query('ROLLBACK');
      console.error('🧪 [TruequeIssuer] already issued:', userId, 'tradeMaskSid=', user.tid);
      return { trade_mask_sid: user.tid };
    }

    const dayKey = now.toISOString().slice(0, 10).replace(/-/g, '');
    // lock the sequence row for update
    const seqRowRes = await client.query(
      'SELECT * FROM trueque_sequences WHERE day = $1 AND country = $2 FOR UPDATE',
      [dayKey, countryCode]
    );
    const seqRow = seqRowRes.rows[0];

    const seq = seqRow ? Number(seqRow.seq) + 1 : 1;

    if (seqRow) {
      await client.query(
        'UPDATE trueque_sequences SET seq = $1 WHERE day = $2 AND country = $3',
        [seq, seqRow.day, countryCode]
      );
    } else {
      await client.query(
        'INSERT INTO trueque_sequences (day, country, seq) VALUES ($1, $2, $3)',
        [dayKey, countryCode, seq]
      );
    }

    // generateSymmetriId currently expects no arguments according to TS
    const tradeMaskSid = generateSymmetriId();

    console.error('🧪 [TruequeIssuer] about to update users row:', userId, 'tradeMaskSid=', tradeMaskSid, 'kyc_now=', now.toISOString());

    await client.query(
      `UPDATE users
       SET tid = $1, kyc_verified_at = $2, kyc_status = $3
       WHERE id = $4`,
      [tradeMaskSid, now.toISOString(), 'approved', userId]
    );

    // console.error('🧪 [TruequeIssuer] update executed for:', userId);
    // Note: kyc_audit table is currently missing in DB. Skipping audit log.

    await client.query('COMMIT');
    return { trade_mask_sid: tradeMaskSid };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('🧪 [TruequeIssuer] rollback failed', rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

// Backwards-compatible alias: some callers import issueSymmetriIdForUser
export { issueSymmetriId as issueSymmetriIdForUser };