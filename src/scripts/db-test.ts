require('dotenv').config();

(async () => {
  try {
    // Use require so ts-node resolves the TypeScript module without needing special compiler flags
    // Resolve relative to this file
    const mod = require('../lib/db') as any;
    const getPool = mod?.default ?? mod;
    const pool = typeof getPool === 'function' ? await Promise.resolve(getPool()) : getPool;
    const c = await pool.connect();
    c.release();
    console.log('module connected');
    process.exit(0);
  } catch (e: any) {
    console.error('module connect failed', e?.message ?? e);
    process.exit(1);
  }
})();