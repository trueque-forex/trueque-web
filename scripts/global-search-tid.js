
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

        console.log("--- GLOBAL SEARCH FOR S20260201 ---");
        for (const table of tables) {
            const columnsRes = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${table}' AND data_type IN ('text', 'character varying')
            `);
            const columns = columnsRes.rows.map(r => r.column_name);

            if (columns.length === 0) continue;

            const whereClause = columns.map(c => `${c} LIKE '%S20260201%'`).join(' OR ');
            const searchSql = `SELECT * FROM ${table} WHERE ${whereClause}`;

            const res = await client.query(searchSql);
            if (res.rows.length > 0) {
                console.log(`FOUND IN TABLE: ${table}`);
                console.log(JSON.stringify(res.rows, null, 2));
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
