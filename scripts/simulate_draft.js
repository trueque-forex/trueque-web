
const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function simulateDraft() {
    try {
        // 1. Get User
        const user = await pool.query("SELECT id FROM users WHERE email = 'antonio.nuevo@exchange.com'");
        if (user.rows.length === 0) throw new Error('Antonio not found');
        const userId = user.rows[0].id;

        console.log('Attempting insert for user:', userId);

        // 2. Try Insert (Mirrors draft.ts)
        // const [newDraft] = await db('transactions').insert({...})
        // Using raw SQL for simulation, approximating Knex behavior
        const query = `
      INSERT INTO transactions (user_id, status, created_at, source_amount, source_currency, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
        const values = [userId, 'DRAFT', new Date(), null, null, 'Draft Swap'];

        await pool.query(query, values);
        console.log('Insert SUCCESS!');
    } catch (err) {
        console.error('Insert FAILED:', err);
    } finally {
        pool.end();
    }
}

simulateDraft();
