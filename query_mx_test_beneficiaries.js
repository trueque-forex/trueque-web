const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function queryBeneficiaries() {
  try {
    await client.connect();
    const result = await client.query(`
      SELECT * FROM recipient_profiles WHERE owner_id = '9613090e-556d-4d15-8304-7ec99c8e8055'
    `);
    console.log("Beneficiaries for mx_test:", result.rows);
  } catch (err) {
    console.error("DB Query error:", err.message);
  } finally {
    await client.end();
  }
}
queryBeneficiaries();
