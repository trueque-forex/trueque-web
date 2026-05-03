
import { Client } from 'pg';

async function main() {
    // Try to load env vars if not present, but for now rely on process.env from run context or default
    // Assuming the user runs this where .env is available or DB url is set.
    // We can try to read .env file manually if needed, but let's assume the user environment has it or we can fallback.

    // Try to read .env using dotenv if available
    try {
        require('dotenv').config();
    } catch (e) { }

    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/trueque'
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('All Tables:', tablesRes.rows.map(r => r.table_name));

        const beneficiariesRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'beneficiaries'
      ORDER BY ordinal_position;
    `);

        console.log('Schema for beneficiaries:', beneficiariesRes.rows);

        const transactionsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position;
    `);

        console.log('Schema for transactions:', transactionsRes.rows);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

main();
