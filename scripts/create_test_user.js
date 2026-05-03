/**
 * Creates a test user for development/testing.
 * Run: node scripts/create_test_user.js
 *
 * Credentials created:
 *   Email:    test@symmetri.dev
 *   Password: Test1234!
 */

require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const email     = 'test@symmetri.dev';
    const password  = 'Test1234!';
    const firstName = 'Test';
    const lastName  = 'User';
    const phone     = '+15550001234';
    const country   = 'US';

    const passwordHash = await bcrypt.hash(password, 10);

    // Delete existing test user to allow re-running
    await pool.query(`DELETE FROM users WHERE email = $1`, [email]);

    const result = await pool.query(`
        INSERT INTO users (
            first_name, last_name, email, password_hash,
            phone_number, country, city, state, postal_code,
            kyc_status, mfa_enabled, mfa_method,
            tid, created_at
        ) VALUES (
            $1, $2, $3, $4,
            $5, $6, 'Austin', 'TX', '78701',
            'APPROVED', false, null,
            'S20260408US0001', NOW()
        )
        RETURNING id, email, first_name, last_name, kyc_status;
    `, [firstName, lastName, email, passwordHash, phone, country]);

    const user = result.rows[0];
    console.log('\n✅ Test user created successfully!\n');
    console.log('  ID:        ', user.id);
    console.log('  Email:     ', user.email);
    console.log('  Name:      ', user.first_name, user.last_name);
    console.log('  KYC:       ', user.kyc_status);
    console.log('\n  Sign in at: http://localhost:3000/signin');
    console.log('  Email:      test@symmetri.dev');
    console.log('  Password:   Test1234!\n');

    await pool.end();
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    pool.end();
    process.exit(1);
});
