const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function queryAuth() {
  try {
    await client.connect();
    
    const query = `
      SELECT id, email FROM auth.users WHERE email LIKE '%symmetri.dev%'
    `;
    
    const result = await client.query(query);
    console.log("Auth users:", result.rows);
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    await client.end();
  }
}
queryAuth();
