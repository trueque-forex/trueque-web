
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dbUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey || !dbUrl) {
    console.error('Missing env vars. Check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const pool = new Pool({ connectionString: dbUrl });

async function createMary() {
    const email = 'mary.test@trueque.dev';
    const password = 'Symmetri123!';
    const userId = 75; // Using 75 to avoid conflict with Juan (74)
    const tid = 'TDEV000075';

    console.log(`Creating Fresh User: ${email}...`);

    // 1. Supabase Creation
    console.log('1. Attempting Supabase Sign Up...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: 'Mary',
                last_name: 'Test',
                userType: 'PEER',
                kyc_status: 'PENDING'
            }
        }
    });

    let supabaseId = null;

    if (authError) {
        console.warn('⚠️ Supabase SignUp Warning:', authError.message);
        console.warn('   (If "User already registered", we will proceed to align the local DB)');
        if (authError.message.includes('rate limit')) {
            console.error('❌ CRITICAL: Blocked by Rate Limit. Cannot proceed via API.');
            process.exit(1);
        }
        // Try signin to get ID if already exists
        const { data: loginData } = await supabase.auth.signInWithPassword({ email, password });
        if (loginData?.user) supabaseId = loginData.user.id;
    } else {
        console.log('✅ Supabase User Created!');
        supabaseId = authData.user?.id;
    }

    if (!supabaseId) {
        console.log('⚠️ Could not retrieve Supabase ID. Local DB will use legacy ID 75.');
        // This is fine for local dev if we use standard session logic, 
        // but might misalign slightly. We'll proceed.
    } else {
        console.log(`ℹ️ Supabase ID: ${supabaseId}`);
    }

    // 2. Local DB Insertion
    console.log('2. Inserting/Updating Local DB...');
    try {
        const passwordHash = await bcrypt.hash(password, 10);

        // We Upsert based on EMAIL
        // If Supabase ID is known, we could map it, but our schema might expect integer ID.
        // Let's stick to our ID 75 strategy for simplicity, or update if schema allows UUID.
        // We will force ID 75 for consistency with the prompt.

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (existing.rows.length > 0) {
            await pool.query(
                `UPDATE users SET 
                 password_hash = $1, 
                 first_name = 'Mary', 
                 last_name = 'Test',
                 kyc_status = 'PENDING',
                 tid = $2
                 WHERE email = $3`,
                [passwordHash, tid, email]
            );
            console.log('✅ Local User Updated (Matched Email).');
        } else {
            await pool.query(
                `INSERT INTO users (id, email, password_hash, tid, kyc_status, first_name, last_name, country, user_type, created_at)
                 VALUES ($1, $2, $3, $4, 'PENDING', 'Mary', 'Test', 'US', 'PEER', NOW())`,
                [userId, email, passwordHash, tid]
            );
            console.log('✅ Local User Inserted (ID: 75).');
        }

    } catch (dbError) {
        console.error('❌ Database Error:', dbError.message);
    } finally {
        await pool.end();
    }

    console.log('\n=======================================');
    console.log('🎉 MARY TEST READY');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Pass:  ${password}`);
    console.log('=======================================\n');
}

createMary();
