
const { Client } = require('pg');

async function main() {
    try {
        require('dotenv').config();
    } catch (e) { }

    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/trueque'
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'beneficiaries'
      ORDER BY ordinal_position;
    `);

        const columns = res.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n');
        console.log('BENEFICIARIES COLUMNS:\n' + columns);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

main();
