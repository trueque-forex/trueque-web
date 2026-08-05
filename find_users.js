const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function findUsers() {
  try {
    await client.connect();
    // In Supabase, users are in auth.users, but there might be a public.users or profiles table.
    // I will try to query public.profiles or similar if it exists.
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%user%' OR table_name LIKE '%profile%'
    `);
    console.log("Tables:", result.rows);
  } catch (err) {
    console.error("DB Query error:", err.message);
  } finally {
    await client.end();
  }
}
findUsers();
