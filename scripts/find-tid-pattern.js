
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("--- SEARCHING FOR S20260201 ---");
        const res = await client.query(`
            SELECT id, email, trueque_id, tid, created_at 
            FROM users 
            WHERE trueque_id LIKE 'S20260201%' OR tid LIKE 'S20260201%'
        `);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
