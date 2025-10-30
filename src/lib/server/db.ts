<<<<<<< HEAD
// src/lib/server/db.ts
let pool: import('pg').Pool | null = null;

export function getPool() {
  if (!pool) {
    // runtime require ensures this is only evaluated on server
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/trueque_dev',
      // add ssl or other options here if needed
    });
  }
  return pool;
=======
// src/lib/db.ts
// If you already have a default export, keep it and add this named export.
// Example using pg Pool lazy init:

import { Pool } from 'pg';

let pool: Pool | null = null;

export default function getPoolDefault() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export function getPool() {
  return getPoolDefault();
}

// Optional small helper export for query
export async function query(text: string, params?: any[]) {
  const p = getPool();
  return p.query(text, params);
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
}