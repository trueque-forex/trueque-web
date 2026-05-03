
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("RECENT OFFERS:");
        // Use * to avoid column name errors
        const offers = await client.query("SELECT * FROM offers ORDER BY created_at DESC LIMIT 5");
        console.table(offers.rows.map(r => ({ id: r.id, uuid: r.uuid, status: r.status, from: r.currency_from, to: r.currency_to })));

        console.log("\nRECENT TRANSACTIONS:");
        const txs = await client.query("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5");
        console.table(txs.rows.map(r => ({ id: r.id, status: r.status, cur: r.currency, t_cur: r.currency_received })));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
