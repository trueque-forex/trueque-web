
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        console.log("--- MATCHES COLUMNS ---");
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'matches'
        `);
        console.log(JSON.stringify(res.rows.map(r => r.column_name), null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
