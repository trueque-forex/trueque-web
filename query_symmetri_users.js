const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function queryUsers() {
  try {
    await client.connect();
    const result = await client.query(`
      SELECT id, email FROM users WHERE email LIKE '%symmetri.dev%'
    `);
    console.log("Symmetri test users:", result.rows);
  } catch (err) {
    console.error("DB Query error:", err.message);
  } finally {
    await client.end();
  }
}
queryUsers();
