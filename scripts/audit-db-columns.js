
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        const tables = ['users', 'offers', 'transactions', 'matches', 'beneficiaries'];

        console.log("--- DATABASE COLUMN AUDIT ---");
        for (const table of tables) {
            console.log(`\nTABLE: ${table}`);
            const res = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = '${table}'
                ORDER BY ordinal_position
            `);
            console.table(res.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
