// src/lib/db.ts
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export default getPool;

export async function query(text: string, params?: any[]) {
  const p = getPool();
  return p.query(text, params);
}

/**
 * Transaction helper compatible with pg.Pool.
 * Usage:
 *   await transaction(async (client) => {
 *     await client.query('INSERT ...', [...]);
 *     return someValue;
 *   });
 */
export async function transaction<T>(cb: (client: any) => Promise<T>): Promise<T> {
  const p = getPool();
  // Cast to any to avoid TypeScript complaining about possibly-undefined connect
  const client = await (p as any).connect();
  try {
    await client.query('BEGIN');
    const result = await cb(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Compatibility shim: attach .transaction to the pool object so older code using pool.transaction(...) still works.
try {
  const p = getPool() as any;
  if (typeof p.transaction === 'undefined') {
    p.transaction = async (cb: (client: any) => Promise<any>) => transaction(cb);
  }
} catch {
  // ignore errors during module load; runtime code will still import transaction() directly
}