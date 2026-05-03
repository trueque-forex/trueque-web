
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function cleanup() {
    try {
        // 1. Safety Gate
        if (process.env.NODE_ENV === 'production') {
            console.error('❌ FATAL: Cannot run cleanup in PRODUCTION environment.');
            process.exit(1);
        }

        console.log('🧹 Starting Database Cleanup...');
        await client.connect();

        // 2. Execute Cleanup
        const query = `
            DELETE FROM beneficiaries 
            WHERE name ILIKE '%Test%' 
            OR name ILIKE '%Mock%' 
            OR name = 'Maria Test';
        `;

        const res = await client.query(query);
        console.log(`✅ Cleanup Complete: Deleted ${res.rowCount} test records.`);

        // 3. Verification Count
        const countRes = await client.query('SELECT COUNT(*) FROM beneficiaries');
        console.log(`📊 Valid Beneficiaries Remaining: ${countRes.rows[0].count}`);

    } catch (err) {
        console.error('❌ cleanup failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

cleanup();
