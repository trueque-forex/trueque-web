
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("--- TRANSACTIONS COLUMNS ---");
        const resT = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'transactions'
        `);
        console.log(resT.rows.map(r => r.column_name));

        console.log("\n--- OFFERS COLUMNS ---");
        const resO = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'offers'
        `);
        console.log(resO.rows.map(r => r.column_name));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
