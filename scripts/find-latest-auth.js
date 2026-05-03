
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("--- LATEST AUTH.USERS ---");
        const res = await client.query(`
            SELECT id, email, created_at, phone
            FROM auth.users 
            ORDER BY created_at DESC
            LIMIT 5
        `);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
