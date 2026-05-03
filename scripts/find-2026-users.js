
const { Client } = require('pg');
const fs = require('fs');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT id, email, first_name, last_name, tid, trueque_id, created_at 
            FROM users 
            WHERE created_at >= '2026-01-01 00:00:00'
            ORDER BY created_at DESC
        `);
        fs.writeFileSync('scripts/users_2026.json', JSON.stringify(res.rows, null, 2));
        console.log(`Found ${res.rows.length} users in 2026.`);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
