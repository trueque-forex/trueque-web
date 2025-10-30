// File: scripts/backfill-tid.js
// Run with: $env:DATABASE_URL="postgresql://postgres:pass@127.0.0.1:5432/trueque_dev" node scripts/backfill-tid.js [--apply] [--limit=100]
const getKnex = require('../src/lib/db').default;
const knex = getKnex();
const { buildTidAndReserve } = require('../src/lib/buildTID'); // adjust if needed

const argv = require('minimist')(process.argv.slice(2));
const APPLY = !!argv.apply;
const PAGE = parseInt(argv.limit || '100', 10);

async function backfillBatch(limit = PAGE) {
  const users = await knex('users').where('tid', 'like', 'TDEV%').limit(limit);
  if (!users.length) return false;
  for (const u of users) {
    await knex.transaction(async (trx) => {
      const country = ((u.country_of_residence || 'XX') + '').toUpperCase().slice(0,2);
      const created = u.created_at ? new Date(u.created_at) : new Date();
      const newTid = await buildTidAndReserve(trx, created, country);
      console.log(u.id, u.tid, '=>', newTid);
      if (APPLY) {
        await trx('users').where({ id: u.id }).update({ tid: newTid });
        await trx('tid_backfill_audit').insert({ user_id: u.id, old_tid: u.tid, new_tid: newTid }).catch(()=>{});
      } else {
        // rollback on dry run by throwing after printing; but we used trx and did not commit changes
      }
    });
  }
  return true;
}

(async function run() {
  try {
    // ensure audit table exists when applying
    if (APPLY) {
      await knex.schema.hasTable('tid_backfill_audit').then(async (exists) => {
        if (!exists) {
          await knex.schema.createTable('tid_backfill_audit', (t) => {
            t.uuid('user_id').primary();
            t.string('old_tid');
            t.string('new_tid');
            t.timestamp('backfilled_at').defaultTo(knex.fn.now());
          });
        }
      });
    }

    while (await backfillBatch(PAGE)) {
      if (!APPLY) {
        console.log('Dry run page complete. Rerun with --apply to persist changes.');
        break;
      }
    }
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();