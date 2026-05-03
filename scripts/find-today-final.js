
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();

        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        const tables = tablesRes.rows.map(r => r.table_name);

        console.log("--- ACTIVITY IN LAST 6 HOURS ---");
        for (const table of tables) {
            const columnsRes = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${table}' AND (column_name = 'created_at' OR column_name = 'timestamp' OR column_name = 'updated_at')
            `);
            const dateCols = columnsRes.rows.map(r => r.column_name);

            for (const col of dateCols) {
                const res = await client.query(`
                    SELECT * FROM ${table} 
                    WHERE ${col} >= NOW() - INTERVAL '6 hours'
                    LIMIT 1
                `);
                if (res.rows.length > 0) {
                    console.log(`FOUND ACTIVITY IN: ${table} (${col})`);
                    console.log(JSON.stringify(res.rows[0], null, 2));
                }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
