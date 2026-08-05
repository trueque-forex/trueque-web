const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function testUpdate() {
  try {
    await client.connect();
    
    // Simulate what [id].ts does
    const id = '7c4274fb-ab13-4731-8cc1-d4e499263617'; // most recent DRAFT offer
    
    const updateSql = `
      UPDATE offers
      SET adyen_stored_payment_id = $1, status = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;
    const result = await client.query(updateSql, ['mock_adyen_token_wizard_999', 'OPEN', id]);
    
    console.log("Update Success:", result.rows);
  } catch (err) {
    console.error("DB Update error:", err.message);
  } finally {
    await client.end();
  }
}

testUpdate();
