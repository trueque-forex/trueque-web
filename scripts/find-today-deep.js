
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("--- MATCHES CREATED TODAY ---");
        const resM = await client.query(`
            SELECT * FROM matches 
            WHERE created_at >= '2026-02-01 00:00:00'
            ORDER BY created_at DESC
        `).catch(e => {
            return client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'matches'");
        });
        console.log(JSON.stringify(resM.rows, null, 2));

        console.log("\n--- RECENT TRANSACTIONS (LATEST 10) ---");
        const resT = await client.query(`
            SELECT * FROM transactions 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        console.log(JSON.stringify(resT.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
