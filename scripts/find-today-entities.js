
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("--- TRANSACTIONS CREATED TODAY ---");
        const resTx = await client.query(`
            SELECT id, owner_id, status, created_at 
            FROM transactions 
            WHERE created_at >= '2026-02-01 00:00:00'
            ORDER BY created_at DESC
        `);
        console.log(JSON.stringify(resTx.rows, null, 2));

        console.log("\n--- OFFERS CREATED TODAY ---");
        const resOff = await client.query(`
            SELECT id, user_id, status, created_at 
            FROM offers 
            WHERE created_at >= '2026-02-01 00:00:00'
            ORDER BY created_at DESC
        `);
        console.log(JSON.stringify(resOff.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
