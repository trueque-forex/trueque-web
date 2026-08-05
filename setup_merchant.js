const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
    });
    await client.connect();

    try {
        // Find existing test user to copy password hash
        const resUser = await client.query(`SELECT password_hash FROM users WHERE email = 'us_test@symmetri.dev' LIMIT 1`);
        const passHash = resUser.rows[0].password_hash;

        // Ensure merchant user
        let merchant = await client.query(`SELECT id FROM users WHERE email = 'merchant@symmetri.dev' LIMIT 1`);
        if (merchant.rows.length === 0) {
            await client.query(`INSERT INTO users (id, first_name, last_name, symmetri_id, email, password_hash, user_type, kyc_status) VALUES (gen_random_uuid(), 'Test', 'Merchant', '@merchanttest', 'merchant@symmetri.dev', $1, 'MERCHANT', 'APPROVED')`, [passHash]);
            merchant = await client.query(`SELECT id FROM users WHERE email = 'merchant@symmetri.dev' LIMIT 1`);
        }
        const mId = merchant.rows[0].id;
        
        // Ensure merchant profile
        let mProf = await client.query(`SELECT id FROM merchants WHERE user_id = $1 LIMIT 1`, [mId]);
        if (mProf.rows.length === 0) {
            await client.query(`INSERT INTO merchants (id, user_id, business_name, contact_email) VALUES (gen_random_uuid(), $1, 'Test Business', 'merchant@symmetri.dev')`, [mId]);
            mProf = await client.query(`SELECT id FROM merchants WHERE user_id = $1 LIMIT 1`, [mId]);
        }
        const merchantProfileId = mProf.rows[0].id;

        // Ensure retailer
        let ret = await client.query(`SELECT id FROM retailers WHERE merchant_id = $1 LIMIT 1`, [merchantProfileId]);
        if (ret.rows.length === 0) {
            await client.query(`INSERT INTO retailers (id, merchant_id, name, country, currency) VALUES ('RET-TEST-1', $1, 'Test Retailer', 'US', 'USD')`, [merchantProfileId]);
            ret = await client.query(`SELECT id FROM retailers WHERE merchant_id = $1 LIMIT 1`, [merchantProfileId]);
        }
        const retId = ret.rows[0].id;

        // Ensure synthetic liquidity
        let liq = await client.query(`SELECT id, available_balance FROM synthetic_liquidity WHERE retailer_id = $1 LIMIT 1`, [retId]);
        if (liq.rows.length === 0) {
            await client.query(`INSERT INTO synthetic_liquidity (id, retailer_id, available_balance, currency) VALUES (gen_random_uuid(), $1, 1000.00, 'USD')`, [retId]);
        } else {
            await client.query(`UPDATE synthetic_liquidity SET available_balance = 1000.00 WHERE retailer_id = $1`, [retId]);
        }

        console.log("Merchant seeded successfully: merchant@symmetri.dev / password same as us_test (uS_test!234)");
        console.log("Retailer ID:", retId);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
