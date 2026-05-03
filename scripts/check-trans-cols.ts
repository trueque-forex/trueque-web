
import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function main() {
    const client = new Client({
        connectionString: 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    try {
        await client.connect();
        const url = process.env.DATABASE_URL || '';
        console.log('DB Connected to', url.split('@')[1] || url);

        const res = await client.query(`
            SELECT a.attname as column_name
            FROM pg_class t
            JOIN pg_attribute a ON a.attrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            WHERE t.relname = 'transactions'
              AND a.attnum > 0
              AND NOT a.attisdropped
        `);
        const cols = res.rows.map(r => r.column_name);
        console.log('Columns in transactions:', cols);

        const checkCols = ['handshake_expires_at', 'payout_rail', 'inbound_verified'];
        const missing = checkCols.filter(c => !cols.includes(c));
        if (missing.length === 0) {
            console.log('✅ All orchestration columns exist.');
        } else {
            console.warn('❌ Missing orchestration columns:', missing);
        }
        fs.writeFileSync('schema_inspection.json', JSON.stringify(cols, null, 2));
    } catch (e: any) {
        console.error('Query failed:', e.message);
    } finally {
        await client.end();
    }
}
main();
