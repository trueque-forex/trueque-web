const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function debugSignin() {
    const email = 'joao.teste@trueque.dev';
    const password = 'jt123456';

    console.log('--- DEBUG SIGNIN START ---');
    console.log('Checking for user:', email);

    try {
        const res = await pool.query('SELECT * FROM users WHERE email_canonical = $1', [email]);
        console.log('Rows found:', res.rows.length);

        if (res.rows.length === 0) {
            console.log('User NOT FOUND in database.');
        } else {
            const user = res.rows[0];
            console.log('User found:', {
                id: user.id,
                email: user.email,
                password_hash: user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'
            });

            if (user.password_hash) {
                console.log('Verifying password...');
                const match = await bcrypt.compare(password, user.password_hash);
                console.log('Password match result:', match);
            } else {
                console.log('User has NO password hash!');
            }
        }
    } catch (err) {
        console.error('Database error:', err);
    } finally {
        await pool.end();
        console.log('--- DEBUG SIGNIN END ---');
    }
}

debugSignin();
