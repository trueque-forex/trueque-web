const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const client = new Client({ connectionString });

async function checkUser() {
  try {
    await client.connect();
    console.log("Connected to DB");
    
    // First, let's see what columns exist in the users table
    const result = await client.query("SELECT * FROM users WHERE email='us_test@symmetri.dev'");
    if (result.rows.length === 0) {
      console.log("User not found!");
    } else {
      const user = result.rows[0];
      console.log("User DB Record:", JSON.stringify(user, null, 2));
      
      // Specifically check MFA flags
      console.log("--- MFA FLAGS ---");
      console.log("mfa_enabled:", user.mfa_enabled);
      console.log("mfa_secret (length):", user.mfa_secret ? user.mfa_secret.length : 0);
      console.log("mfa_verified:", user.mfa_verified);
    }
  } catch (err) {
    console.error("DB Query error:", err.message);
  } finally {
    await client.end();
  }
}

checkUser();
