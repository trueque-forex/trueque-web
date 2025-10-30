// File: scripts/cleanup-trueque-test-users.js
// Usage:
//   Dry run (safe): node scripts/cleanup-trueque-test-users.js
//   Execute deletes: node scripts/cleanup-trueque-test-users.js --run
//   Force in non-dev (not recommended): NODE_ENV=production node scripts/cleanup-trueque-test-users.js --run --force

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const EMAIL_PATTERN = process.env.TEST_EMAIL_PATTERN || 'joao.teste%'; // SQL LIKE pattern
const EXECUTE = process.argv.includes('--run');
const FORCE = process.argv.includes('--force');

if (process.env.NODE_ENV !== 'development' && !FORCE) {
  console.error('Abort: NODE_ENV is not development. Use --force to override.');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Abort: DATABASE_URL is not set.');
  process.exit(1);
}

// Tables to clean related to users. Adjust names if your schema differs.
const RELATED_TABLES = [
  { name: 'beneficiaries', fk: 'user_id' },
  { name: 'sessions', fk: 'user_id' },
  { name: 'offers', fk: 'maker_user_id' },         // offers created by user
  { name: 'offers', fk_alt: 'taker_user_id' },     // offers taken by user (delete separately by user id)
  { name: 'offers_audit', fk: 'user_id' },
  { name: 'transactions', fk: 'user_id' },
  { name: 'kyc_records', fk: 'user_id' },
  { name: 'payments', fk: 'user_id' },
  { name: 'notifications', fk: 'user_id' },
  // add more related tables here as needed, e.g. { name: 'balances', fk: 'user_id' }
];

// Output file with SQL that would run (for review)
const SQL_OUTPUT_PATH = path.resolve(process.cwd(), 'tmp', `cleanup_trueque_${Date.now()}.sql`);

async function promptYesNo(question) {
  return new Promise(resolve => {
    const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, ans => {
      rl.close();
      resolve(/^y(es)?$/i.test(ans.trim()));
    });
  });
}

function buildPreviewQueries(emailPattern) {
  // preview select
  const previewSelect = `SELECT id, email, created_at FROM users WHERE email LIKE '${emailPattern}' ORDER BY created_at DESC;`;

  // build deletion SQL statements (delete dependents first)
  const deletes = [];

  // delete from related tables using subselect
  RELATED_TABLES.forEach(entry => {
    if (entry.fk) {
      deletes.push(`DELETE FROM ${entry.name} WHERE ${entry.fk} IN (SELECT id FROM users WHERE email LIKE '${emailPattern}');`);
    }
    if (entry.fk_alt) {
      deletes.push(`DELETE FROM ${entry.name} WHERE ${entry.fk_alt} IN (SELECT id FROM users WHERE email LIKE '${emailPattern}');`);
    }
  });

  // finally delete users
  deletes.push(`DELETE FROM users WHERE email LIKE '${emailPattern}';`);

  // wrap in transaction
  const txSql = ['BEGIN;', ...deletes, 'COMMIT;'].join('\n');

  return { previewSelect, txSql };
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // Preview matched users
    const previewQuery = `SELECT id, email, created_at FROM users WHERE email LIKE $1 ORDER BY created_at DESC LIMIT 1000;`;
    const previewRes = await client.query(previewQuery, [EMAIL_PATTERN]);
    console.log(`\nFound ${previewRes.rowCount} user(s) matching pattern "${EMAIL_PATTERN}"`);
    previewRes.rows.forEach(r => console.log(r));

    const { previewSelect, txSql } = buildPreviewQueries(EMAIL_PATTERN);

    // Ensure tmp folder exists
    fs.mkdirSync(path.dirname(SQL_OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(SQL_OUTPUT_PATH, `-- Preview SELECT\n${previewSelect}\n\n-- Transactional DELETE statements\n${txSql}\n`);
    console.log(`\nSQL preview written to: ${SQL_OUTPUT_PATH}`);
    console.log('\nReview the SQL file before executing. The script performs a dry-run by default.');

    if (!EXECUTE) {
      console.log('\nDry run complete. To execute deletions, re-run with --run');
      await client.end();
      return;
    }

    // Confirm with user unless forced
    if (!FORCE) {
      const confirmed = await promptYesNo('Are you sure you want to DELETE these users and related data? This is irreversible. (y/N) ');
      if (!confirmed) {
        console.log('Aborted by user.');
        await client.end();
        return;
      }
    }

    // Execute deletion transaction
    await client.query('BEGIN');

    for (const entry of RELATED_TABLES) {
      if (entry.fk) {
        const q = `DELETE FROM ${entry.name} WHERE ${entry.fk} IN (SELECT id FROM users WHERE email LIKE $1);`;
        const res = await client.query(q, [EMAIL_PATTERN]);
        console.log(`Deleted ${res.rowCount} from ${entry.name} (fk ${entry.fk})`);
      }
      if (entry.fk_alt) {
        const q2 = `DELETE FROM ${entry.name} WHERE ${entry.fk_alt} IN (SELECT id FROM users WHERE email LIKE $1);`;
        const res2 = await client.query(q2, [EMAIL_PATTERN]);
        console.log(`Deleted ${res2.rowCount} from ${entry.name} (fk ${entry.fk_alt})`);
      }
    }

    // delete users
    const delUsers = await client.query(`DELETE FROM users WHERE email LIKE $1 RETURNING id, email;`, [EMAIL_PATTERN]);
    console.log(`Deleted ${delUsers.rowCount} user record(s)`);

    await client.query('COMMIT');
    console.log('Delete transaction committed.');
  } catch (err) {
    console.error('Error during cleanup:', err);
    try { await client.query('ROLLBACK'); console.log('Rolled back transaction.'); } catch (e) {}
  } finally {
    await client.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });