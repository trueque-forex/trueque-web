const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function checkConstraint() {
  try {
    await client.connect();
    const result = await client.query(`
      SELECT pg_get_constraintdef(c.oid) AS constraint_def
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'offers' AND c.conname = 'offers_swap_type_check'
    `);
    console.log(result.rows[0].constraint_def);
  } catch (err) {
    console.error("DB Query error:", err.message);
  } finally {
    await client.end();
  }
}
checkConstraint();
