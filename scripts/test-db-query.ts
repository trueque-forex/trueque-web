
import { getKnex } from '../src/lib/db';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const knex = getKnex();
    try {
        console.log('Attempting to query transactions table...');
        const res = await knex('transactions').select('*').limit(1);
        console.log('Success! Columns:', Object.keys(res[0] || {}));
    } catch (err: any) {
        console.error('Query failed!');
        console.error('Message:', err.message);
        if (err.message.includes('column')) {
            console.log('The table EXISTS but a column is missing.');
        } else if (err.message.includes('relation')) {
            console.log('The table DOES NOT EXIST.');
        }
    } finally {
        await knex.destroy();
    }
}
main();
