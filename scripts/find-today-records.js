
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("--- OFFERS CREATED TODAY ---");
        const resOff = await client.query(`
            SELECT id, uuid, owner_id, timestamp
            FROM offers 
            WHERE timestamp >= NOW() - INTERVAL '24 hours'
            ORDER BY timestamp DESC
        `);
        console.log(JSON.stringify(resOff.rows, null, 2));

        console.log("\n--- TRANSACTIONS CREATED TODAY ---");
        // Checking for 'timestamp' or 'created_at' - using a schema-safe query
        const resTx = await client.query(`
            SELECT * FROM transactions WHERE timestamp >= NOW() - INTERVAL '24 hours'
            UNION ALL
            SELECT * FROM transactions WHERE created_at >= NOW() - INTERVAL '24 hours'
        `).catch(e => {
            // If the above fails, try selecting columns manually after checking names
            return client.query("SELECT * FROM transactions LIMIT 1");
        });

        console.log(JSON.stringify(resTx.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
