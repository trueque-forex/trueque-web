// src/lib/server/db.ts
import { Pool } from "pg";
import getLibPool from "../db"; // re-use src/lib/db.ts singleton

let _pool: Pool | null = null;

export default function getPool(): Pool {
  if (_pool) return _pool;
  // reuse the lib pool to ensure a single connection pool per process
  _pool = getLibPool();
  return _pool;
}

/**
 * Simple query helper (convenience)
 */
export async function query<T = any>(text: string, params?: any[]) {
  const p = getPool();
  return p.query<T>(text, params);
}

/**
 * Transaction helper:
 * await transaction(async (client) => { await client.query(...); return result; });
 * Will BEGIN/COMMIT/ROLLBACK and always release client.
 */
export async function transaction<T>(cb: (client: any) => Promise<T>): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const result = await cb(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}