const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function getCols() {
  try {
    await client.connect();
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'recipient_profiles'
    `);
    console.log("Columns:", result.rows.map(r => r.column_name));
  } catch (err) {
    console.error("DB Query error:", err.message);
  } finally {
    await client.end();
  }
}
getCols();
