
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Basic .env parser
function loadEnv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            env[match[1]] = value;
        }
    }
    return env;
}

async function run() {
    const env = loadEnv('.env.local');
    const dbUrl = env.DATABASE_URL;
    console.log("Using DATABASE_URL from .env.local:", dbUrl.replace(/:[^:@]+@/, ":****@"));

    const client = new Client({ connectionString: dbUrl });
    try {
        await client.connect();

        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables in .env.local DB:", res.rows.map(r => r.table_name).join(', '));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
