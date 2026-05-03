
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("--- SEARCHING FOR TONY/PEREZ ---");
        const res = await client.query(`
            SELECT id, email, first_name, last_name, tid, trueque_id, created_at 
            FROM users 
            WHERE first_name ILIKE '%Tony%' OR last_name ILIKE '%Perez%'
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
