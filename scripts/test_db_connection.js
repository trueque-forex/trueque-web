// scripts/test_db_connection.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runTest() {
    console.log("🔍 Symmetri Database Diagnostic Started...");

    try {
        // This replicates the failing import in your signin.ts
        // Note: This requires running with ts-node or similar if importing .ts files directly
        const dbModule = await import('../src/lib/db.ts');
        const getKnexFn = dbModule.getKnex || dbModule.default?.getKnex;

        if (typeof getKnexFn !== 'function') {
            console.error("❌ FAIL: 'getKnex' is not a function. Current type:", typeof getKnexFn);
            console.log("💡 HINT: Your db.ts export is likely returning a Promise or is malformed.");
            return;
        }

        const knex = getKnexFn();
        const result = await knex.raw('SELECT NOW()');
        console.log("✅ SUCCESS: Database connected at:", result.rows[0].now);

        const user = await knex('users').where({ email: 'pedro.perez@symmetri.forex' }).first();
        if (user) {
            console.log(`✅ SUCCESS: Found User ID ${user.id} (Pedro Perez)`);
            console.log(`📊 KYC Status: ${user.kyc_status}`);
        } else {
            console.log("⚠️ WARNING: Pedro Perez not found in the 'users' table.");
        }

    } catch (err) {
        console.error("❌ CRITICAL ERROR during diagnostic:", err.message);
    } finally {
        process.exit();
    }
}

runTest();
