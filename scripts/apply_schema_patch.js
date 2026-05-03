const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
// Load env explicitly from parent dir
const result = require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
if (result.error) {
    console.error('Dotenv error:', result.error);
} else {
    console.log('Dotenv loaded keys:', Object.keys(result.parsed || {}));
}

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error('Error: DATABASE_URL is undefined in process.env');
        // fallback check
        if (result.parsed && result.parsed.DATABASE_URL) {
            console.log('Found in parsed but not process.env? fixing...');
            process.env.DATABASE_URL = result.parsed.DATABASE_URL;
        }
        if (!process.env.DATABASE_URL) { // Check again after potential fix
            process.exit(1);
        }
    }
    console.log('Connecting to DB...', process.env.DATABASE_URL.split('@')[1] || 'LOCAL');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected.');

        console.log('Executing: ALTER TABLE users ALTER COLUMN country_destiny DROP NOT NULL');
        await client.query('ALTER TABLE users ALTER COLUMN country_destiny DROP NOT NULL');
        console.log('Success: country_destiny is nullable.');

        // Verify
        const res = await client.query("SELECT is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country_destiny'");
        console.log('Verification (is_nullable):', res.rows[0]);

    } catch (err) {
        console.error('Schema patch failed:', err);
    } finally {
        await client.end();
    }
}

run();
