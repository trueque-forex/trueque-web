
const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function updateUserName(email) {
    try {
        const res = await pool.query(
            'UPDATE users SET first_name = $1, last_name = $2 WHERE email = $3 RETURNING id, email, first_name',
            ['Antonio', 'Nuevo', email]
        );

        if (res.rows.length > 0) {
            console.log('User updated successfully:', res.rows[0]);
        } else {
            console.log('User not found during update:', email);
        }
    } catch (err) {
        console.error('Database error:', err);
    } finally {
        await pool.end();
    }
}

updateUserName('antonio.nuevo@example.com');
