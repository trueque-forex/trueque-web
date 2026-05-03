
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        process.stdout.write(JSON.stringify(res.rows.map(r => r.column_name)));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
main();
