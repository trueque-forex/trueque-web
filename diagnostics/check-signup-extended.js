// diagnostics/check-signup-extended.js
const getPool = require('../lib/db').default || require('../lib/db');
(async ()=> {
  const pool = typeof getPool === 'function' ? getPool() : getPool;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // remove any conflicting test rows first (best-effort)
    await client.query("DELETE FROM beneficiaries WHERE email = $1", ['tester+local@example.test']).catch(()=>{});
    await client.query("DELETE FROM users WHERE email = $1", ['tester+local@example.test']).catch(()=>{});
    await client.query("DELETE FROM users WHERE username_canonical = $1", ['tester_local']).catch(()=>{});

    // perform same sequence as signup handler (insert, tid update, beneficiary insert)
    const ins = await client.query(
      `INSERT INTO users (username, username_canonical, email, email_canonical, password, created_at, is_test)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
      ['tester_local','tester_local','tester+local@example.test','tester+local@example.test','hash', new Date(), true]
    );

    const newId = ins.rows[0].id;

    // replicate your TID logic (adjust if your handler differs)
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
    try { await client.query('ROLLBACK'); } catch(_) {}
    console.error('DIAG ERROR', {
      code: e && e.code,
      constraint: e && e.constraint,
      detail: e && e.detail,
      message: e && e.message,
      stack: e && e.stack
    });
  } finally {
    client.release();
    process.exit(0);
  }
})();