
import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
        `);

        const tables: Record<string, string[]> = {};
        res.rows.forEach(row => {
            if (!tables[row.table_name]) tables[row.table_name] = [];
            tables[row.table_name].push(row.column_name);
        });

        fs.writeFileSync('full_schema_dump.json', JSON.stringify(tables, null, 2));
        console.log('Results written to full_schema_dump.json');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
main();
