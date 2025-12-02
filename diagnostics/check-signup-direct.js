// diagnostics/check-signup-direct.js
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || (() => {
  try {
    // fallback: read .env.local simple parse
    const fs = require('fs');
    const s = fs.readFileSync('.env.local', 'utf8');
    const m = s.match(/^DATABASE_URL=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch (e) { return null; }
})();

if (!connectionString) {
  console.error('No DATABASE_URL found in env or .env.local');
  process.exit(2);
}

const pool = new Pool({ connectionString });

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // best-effort cleanup to avoid unique conflicts
    await client.query("DELETE FROM beneficiaries WHERE email = $1", ['tester+local@example.test']).catch(()=>{});
    await client.query("DELETE FROM users WHERE email = $1", ['tester+local@example.test']).catch(()=>{});
    await client.query("DELETE FROM users WHERE username_canonical = $1", ['tester_local']).catch(()=>{});

    // insert user (mimic handler)
    const ins = await client.query(
      `INSERT INTO users (username, username_canonical, email, email_canonical, password, created_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      ['tester_local','tester_local','tester+local@example.test','tester+local@example.test','hash', new Date()]
    );

    const newId = ins.rows[0].id;
    const tid = `TDEV${String(newId).padStart(6,'0')}`;
    await client.query('UPDATE users SET tid = $1 WHERE id = $2', [tid, newId]);

    await client.query(
      `INSERT INTO beneficiaries (user_id, name, account_type, account_identifier, email)
       VALUES ($1,$2,$3,$4,$5)`,
      [newId, 'Diag Benef', 'bank', 'acct-123', 'tester+local@example.test']
    );

    const sel = await client.query('SELECT id, username, email, tid FROM users WHERE id = $1', [newId]);
    console.log('DIAG OK', sel.rows[0]);

    await client.query('COMMIT');
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (rbErr) { /* ignore */ }
    console.error('DIAG ERROR', {
      code: e && e.code,
      constraint: e && e.constraint,
      detail: e && e.detail,
      message: e && e.message,
      stack: e && e.stack
    });
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
})();