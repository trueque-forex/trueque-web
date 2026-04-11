const { Client } = require('pg');

async function run() {
    console.log('Connecting to trueque_test database...');
    const client = new Client({
        connectionString: "postgresql://trueque_test:testpass@localhost:5432/trueque_test",
    });

    try {
        await client.connect();
        console.log('Connected!');

        // Check Columns
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        const cols = res.rows.map(r => r.column_name);
        console.log('Current Columns:', cols.join(', '));

        if (!cols.includes('phone')) {
            console.log('Adding phone column...');
            await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255)");
            console.log('Column added successfully.');
        } else {
            console.log('Phone column already exists.');
        }
    } catch (e) {
        console.error('Error executing script:', e);
    } finally {
        await client.end();
    }
}

run();
