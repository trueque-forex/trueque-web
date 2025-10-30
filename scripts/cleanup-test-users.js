// File: scripts/cleanup-test-users.js
// Usage:
//   Dry run (safe): node scripts/cleanup-test-users.js
//   Execute deletes: node scripts/cleanup-test-users.js --run
//   Force in non-dev (not recommended): NODE_ENV=production node scripts/cleanup-test-users.js --run --force

const { Client } = require('pg');

const EMAIL_PATTERN = process.env.TEST_EMAIL_PATTERN || 'joao.teste%'; // SQL LIKE pattern
const FORCE = process.argv.includes('--force');
const EXECUTE = process.argv.includes('--run');

if (process.env.NODE_ENV !== 'development' && !FORCE) {
  console.error('Abort: NODE_ENV is not development. Use --force to override.');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Abort: DATABASE_URL is not set.');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // Preview matched users
    const previewRes = await client.query(
      `SELECT id, email, created_at FROM users WHERE email LIKE $1 ORDER BY created_at DESC LIMIT 1000`,
      [EMAIL_PATTERN]
    );
    console.log(`Found ${previewRes.rowCount} user(s) matching pattern "${EMAIL_PATTERN}"`);
    previewRes.rows.forEach(r => console.log(r));

    if (!EXECUTE) {
      console.log('\nDry run complete. To execute deletions, re-run with --run');
      await client.end();
      return;
    }

    // Confirm interactive prompt unless forced
    if (!FORCE) {
      const confirm = await promptYesNo('Are you sure you want to DELETE these users and related data? (y/N) ');
      if (!confirm) {
        console.log('Aborted by user.');
        await client.end();
        return;
      }
    }

    // Delete in a transaction
    await client.query('BEGIN');

    // Delete beneficiaries (adjust table/column names)
    const delBen = await client.query(
      `DELETE FROM beneficiaries WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1) RETURNING id`,
      [EMAIL_PATTERN]
    );
    console.log(`Deleted ${delBen.rowCount} beneficiary record(s)`);

    // Delete users
    const delUsers = await client.query(
      `DELETE FROM users WHERE email LIKE $1 RETURNING id, email`,
      [EMAIL_PATTERN]
    );
    console.log(`Deleted ${delUsers.rowCount} user record(s)`);

    await client.query('COMMIT');
    console.log('Delete transaction committed.');
  } catch (err) {
    console.error('Error during cleanup:', err);
    try { await client.query('ROLLBACK'); console.log('Rolled back transaction.'); } catch {}
  } finally {
    await client.end();
  }
}

function promptYesNo(question) {
  return new Promise(resolve => {
    const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, ans => {
      rl.close();
      const ok = /^y(es)?$/i.test(ans.trim());
      resolve(ok);
    });
  });
}

main().catch(err => { console.error(err); process.exit(1); });