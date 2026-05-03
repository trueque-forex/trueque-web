
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("--- ALL PUBLIC.USERS ---");
        const resP = await client.query(`
            SELECT id, email, created_at, tid, trueque_id 
            FROM users 
            ORDER BY created_at DESC
        `);
        console.log(JSON.stringify(resP.rows, null, 2));

        console.log("\n--- ALL AUTH.USERS ---");
        const resA = await client.query(`
            SELECT id, email, created_at 
            FROM auth.users 
            ORDER BY created_at DESC
        `);
        console.log(JSON.stringify(resA.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
