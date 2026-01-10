// src/scripts/check_db_schema.ts
import { query } from '../lib/db';

async function run() {
    console.log('--- Checking Database Schema for "users" table ---');
    try {
        // 1. Check current columns
        const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);

        const columns = res.rows.map((r: any) => r.column_name);
        console.log('Current "users" columns:', columns);

        if (columns.includes('phone')) {
            console.log('✅ Column "phone" ALREADY EXISTS.');
        } else {
            console.log('❌ Column "phone" is MISSING. Attempting to add it now...');

            // 2. Force Add Column
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255);`);
            console.log('✅ ALTER TABLE command executed.');

            // 3. Verify
            const verifyRes = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone';
      `);
            if (verifyRes.rows.length > 0) {
                console.log('✅ Verification Successful: "phone" column now exists.');
            } else {
                console.error('❌ Verification Failed: Column still missing after ALTER.');
            }
        }

    } catch (e) {
        console.error('Check failed:', e);
    }
    process.exit(0);
}

run();
