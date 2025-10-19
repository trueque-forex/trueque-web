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
}