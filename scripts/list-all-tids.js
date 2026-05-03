
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("--- ALL USERS WITH TIDs ---");
        const res = await client.query(`
            SELECT id, email, tid, trueque_id, created_at 
            FROM users 
            WHERE tid IS NOT NULL OR trueque_id IS NOT NULL
            ORDER BY created_at DESC
        `);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
