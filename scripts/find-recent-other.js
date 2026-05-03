
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("--- RECENT BENEFICIARIES ---");
        const resB = await client.query(`
            SELECT id, name, owner_id, created_at 
            FROM beneficiaries 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log(JSON.stringify(resB.rows, null, 2));

        console.log("\n--- RECENT TRANSACTIONS ---");
        const resT = await client.query(`
            SELECT tx_id, owner_id, status, timestamp 
            FROM transactions 
            ORDER BY timestamp DESC 
            LIMIT 5
        `);
        console.log(JSON.stringify(resT.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
