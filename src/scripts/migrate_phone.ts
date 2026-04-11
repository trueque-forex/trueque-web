import { query } from '../lib/db';

async function run() {
    console.log('Starting migration: Add phone column to users table');
    try {
        // Add phone column if not exists
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`);
        console.log('Success: phone column added or already exists.');
    } catch (e) {
        console.error('Migration Error:', e);
        process.exit(1);
    }
    process.exit(0);
}

run();
