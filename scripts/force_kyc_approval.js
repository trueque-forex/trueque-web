
const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/trueque'
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const query = "UPDATE users SET kyc_status = 'approved' WHERE email = 'joao.teste@trueque.dev'";
        const res = await client.query(query);

        console.log(`Update Result: ${res.rowCount} row(s) updated.`);

        // Verify
        const verify = await client.query("SELECT email, kyc_status FROM users WHERE email = 'joao.teste@trueque.dev'");
        console.log('Verification:', verify.rows[0]);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

main();
