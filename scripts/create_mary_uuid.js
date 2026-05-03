
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
}

const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function createMaryUUID() {
    const email = 'mary.uuid@trueque.dev';
    const password = 'Symmetri123!';
    const tid = 'TDEV-UUID-001';

    // Generate a REAL UUID locally to ensure we know it
    const userId = uuidv4();

    console.log(`Creating UUID User: ${email}...`);
    console.log(`Target UUID: ${userId}`);

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        // Check for conflict
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (existing.rows.length > 0) {
            console.log('User already exists. Updating...');
            await pool.query(
                `UPDATE users SET 
                 password_hash = $1, 
                 first_name = 'Mary', 
                 last_name = 'UUID',
                 kyc_status = 'PENDING',
                 tid = $2
                 WHERE email = $3`,
                [passwordHash, tid, email]
            );
            console.log('✅ User Updated.');
        } else {
            console.log('Inserting new user...');
            // Note: We insert explicitly into ID column assuming schema allows it.
            // If schema uses DEFAULT gen_random_uuid(), we can still override it if we provide a value.
            await pool.query(
                `INSERT INTO users (id, email, password_hash, tid, kyc_status, first_name, last_name, country, user_type, created_at)
                 VALUES ($1, $2, $3, $4, 'PENDING', 'Mary', 'UUID', 'US', 'PEER', NOW())`,
                [userId, email, passwordHash, tid]
            );
            console.log('✅ User Inserted.');
        }

    } catch (dbError) {
        console.error('❌ Database Error:', dbError.message);
        console.error('   (Does the users table have "id uuid"? If it is "id serial", this script will fail)');
    } finally {
        await pool.end();
    }

    console.log('\n=======================================');
    console.log('🎉 MARY UUID READY');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Pass:  ${password}`);
    console.log(`🆔 UUID:  ${userId}`);
    console.log('=======================================\n');
}

createMaryUUID();
