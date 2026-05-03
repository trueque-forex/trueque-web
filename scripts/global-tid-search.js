
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

        console.log("--- GLOBAL SEARCH FOR S202602% ---");
        for (const table of tables) {
            const columnsRes = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${table}' AND (data_type = 'text' OR data_type = 'character varying')
            `);
            const textCols = columnsRes.rows.map(r => r.column_name);

            if (textCols.length === 0) continue;

            for (const col of textCols) {
                const searchRes = await client.query(`
                    SELECT * FROM ${table} 
                    WHERE ${col} LIKE 'S202602%'
                    LIMIT 5
                `).catch(err => {
                    // console.log(`Error searching ${table}.${col}: ${err.message}`);
                    return { rows: [] };
                });

                if (searchRes.rows.length > 0) {
                    console.log(`FOUND IN ${table}.${col}:`);
                    console.log(JSON.stringify(searchRes.rows, null, 2));
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
