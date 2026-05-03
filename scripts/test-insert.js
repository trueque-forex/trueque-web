
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

        const query = `
      INSERT INTO beneficiaries
        (user_id, name, account_type, account_identifier, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        // We need a valid user_id to respect foreign key constraint.
        // Let's first get a user ID.
        const userRes = await client.query('SELECT id FROM users LIMIT 1');
        if (userRes.rows.length === 0) {
            console.error('No users found to link beneficiary to.');
            return;
        }
        const userId = userRes.rows[0].id;
        console.log('Using User ID:', userId);

        const values = [
            userId,
            'Test User',
            'bank_account',
            JSON.stringify({ bank: 'Test Bank' }),
            new Date().toISOString()
        ];

        const res = await client.query(query, values);
        console.log('Insert Successful:', res.rows[0]);

    } catch (e) {
        console.error('Insert Failed:', e);
    } finally {
        await client.end();
    }
}

main();
