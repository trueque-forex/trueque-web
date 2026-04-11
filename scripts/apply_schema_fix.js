const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load .env.local first, then .env
const envLocalPath = path.join(__dirname, '../.env.local');
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
    console.log('Loading .env.local');
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.log('No .env.local found');
}

if (fs.existsSync(envPath)) {
    console.log('Loading .env');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        if (!process.env[k]) {
            process.env[k] = envConfig[k];
        }
    }
}

async function run() {
    console.log('Connecting to database...');
    const connectionString = process.env.DATABASE_URL;
    console.log('Using DATABASE_URL:', connectionString ? connectionString.replace(/:[^:@]+@/, ':***@') : 'undefined');

    if (!connectionString) {
        console.error('DATABASE_URL is not defined in environment');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString,
        ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
            ? false
            : { rejectUnauthorized: false }
    });

    try {
        const sqlPath = path.join(__dirname, '../migrations/20251124_fix_users_schema.sql');
        console.log(`Reading migration file from ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing migration SQL...');
        await pool.query(sql);
        console.log('Migration applied successfully!');

        // Verify users
        console.log('Verifying users table columns...');
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
        const columns = res.rows.map(r => r.column_name);
        console.log('Current columns in users table:', columns.join(', '));

        // Verify beneficiaries
        console.log('Verifying beneficiaries table columns...');
        const resBen = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'beneficiaries'
    `);
        const columnsBen = resBen.rows.map(r => r.column_name);
        console.log('Current columns in beneficiaries table:', columnsBen.join(', '));

    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
