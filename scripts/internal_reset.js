
const Redis = require('ioredis');
const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function run() {
    console.log('--- INTERNAL RESET STARTED ---');

    // 1. Flush Redis
    const redis = new Redis(process.env.REDIS_URL);
    try {
        const res = await redis.flushall();
        console.log(`[REDIS] FLUSHALL: ${res}`);
    } catch (err) {
        console.error(`[REDIS] Error: ${err.message}`);
    } finally {
        redis.quit();
    }

    // 2. Check DB Pool / Zombies
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        // Check for blocking queries or zombies
        const res = await client.query(`
      SELECT pid, state, age(clock_timestamp(), query_start) as duration, query 
      FROM pg_stat_activity 
      WHERE state != 'idle' 
      AND pid <> pg_backend_pid()
      ORDER BY duration DESC;
    `);

        console.log(`[DB] Active Transactions: ${res.rows.length}`);
        res.rows.forEach(r => {
            console.log(` - PID: ${r.pid} | Duration: ${r.duration} | State: ${r.state} | Query: ${r.query.substring(0, 50)}...`);
        });

    } catch (err) {
        console.error(`[DB] Error: ${err.message}`);
    } finally {
        await client.end();
    }

    console.log('--- INTERNAL RESET COMPLETE ---');
}

run();
