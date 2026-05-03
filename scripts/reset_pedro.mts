// scripts/reset_pedro.ts
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { getKnex } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function run() {
    console.log('🔄 Resetting password for Pedro Perez...');
    const knex = getKnex();
    const email = 'pedro.perez@symmetri.forex';
    const pass = 'password123';
    const hash = await bcrypt.hash(pass, 10);

    const result = await knex('users')
        .where({ email })
        .update({
            password_hash: hash,
            // Ensure he is not blocked so we can test the flow
            // kyc_status: 'PENDING' 
        })
        .returning(['id', 'email']);

    if (result.length) {
        console.log(`✅ SUCCESS: Updated password for ${result[0].email} (ID: ${result[0].id})`);
    } else {
        console.error(`❌ ERROR: User ${email} not found in database.`);
    }
    process.exit();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
