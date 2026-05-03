
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("--- USERS CREATED IN LAST 12 HOURS ---");
        const res = await client.query(`
            SELECT id, email, tid, trueque_id, created_at 
            FROM users 
            WHERE created_at >= NOW() - INTERVAL '12 hours'
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
