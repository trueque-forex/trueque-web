
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();
        const tonyId = '6979be29-1878-462e-a8db-652db70bc7a2';

        console.log("--- TONY'S ACTIVITY TODAY (FEB 1) ---");

        console.log("\nOFFERS:");
        const resO = await client.query(`
            SELECT * FROM offers 
            WHERE user_id = $1 AND created_at >= '2026-02-01 00:00:00'
        `, [tonyId]);
        console.log(JSON.stringify(resO.rows, null, 2));

        console.log("\nMATCHES (as Maker):");
        const resMm = await client.query(`
            SELECT m.* FROM matches m
            JOIN offers o ON m.offer_id = o.id
            WHERE o.user_id = $1 AND m.created_at >= '2026-02-01 00:00:00'
        `, [tonyId]);
        console.log(JSON.stringify(resMm.rows, null, 2));

        console.log("\nMATCHES (as Taker):");
        const resMt = await client.query(`
            SELECT * FROM matches 
            WHERE taker_id = $1 AND created_at >= '2026-02-01 00:00:00'
        `, [tonyId]);
        console.log(JSON.stringify(resMt.rows, null, 2));

        console.log("\nTRANSACTIONS:");
        const resTx = await client.query(`
            SELECT * FROM transactions 
            WHERE owner_id = $1 AND created_at >= '2026-02-01 00:00:00'
        `, [tonyId]);
        console.log(JSON.stringify(resTx.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
