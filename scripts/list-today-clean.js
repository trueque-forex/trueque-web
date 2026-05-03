
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();
        const date = '2026-02-01 00:00:00';

        console.log("--- TODAY'S RECORDS ---");

        const resU = await client.query("SELECT id, email, tid, trueque_id FROM users WHERE created_at >= $1", [date]);
        console.log("USERS:", JSON.stringify(resU.rows));

        const resO = await client.query("SELECT id, user_id FROM offers WHERE created_at >= $1", [date]);
        console.log("OFFERS:", JSON.stringify(resO.rows));

        const resM = await client.query("SELECT id, offer_id, taker_id FROM matches WHERE created_at >= $1", [date]);
        console.log("MATCHES:", JSON.stringify(resM.rows));

        const resT = await client.query("SELECT id, owner_id FROM transactions WHERE created_at >= $1", [date]);
        console.log("TRANSACTIONS:", JSON.stringify(resT.rows));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
