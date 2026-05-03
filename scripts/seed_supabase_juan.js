
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// We need the SERVICE_ROLE_KEY to create users admin-side, but typically we only have ANON.
// If ANON key fails, we'll ask user to sign up via UI or provide SERVICE_ROLE.
// For now, let's try to Sign Up as a normal user to seed the DB.
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedJuan() {
    console.log('Attempting to seed Juan Nuevo in Supabase Auth...');

    const email = 'juan.nuevo@trueque.dev';
    const password = 'Symmetri123!';

    // Try signing in to check if user exists
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('❌ Error creating Juan:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Juan Nuevo created!', data.user?.id);
        console.log('NOTE: You may need to confirm the email in the Supabase Dashboard if "Enable Email Confirmations" is on.');
    }
}

seedJuan();
