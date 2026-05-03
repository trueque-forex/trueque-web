
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT a.attname as column_name
            FROM pg_class t
            JOIN pg_attribute a ON a.attrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            WHERE t.relname = 'users'
              AND a.attnum > 0
              AND NOT a.attisdropped
        `);
        console.log('Columns in users:', res.rows.map(r => r.column_name));
    } catch (e: any) {
        console.error('Query failed:', e.message);
    } finally {
        await client.end();
    }
}
main();
