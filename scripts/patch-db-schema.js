
const { Client } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
}

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    await client.connect();
    console.log("Connected to DB");

    try {
        console.log("Adding metadata column...");
        await client.query('ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS metadata TEXT;');
        console.log("Column added successfully.");
    } catch (err) {
        console.error("Query error", err);
    } finally {
        await client.end();
    }
}

run();
