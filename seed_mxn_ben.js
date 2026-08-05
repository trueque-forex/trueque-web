const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function seedBeneficiary() {
  try {
    await client.connect();
    
    const owner_id = 'ea5eeb4a-0ce9-4484-9a23-310888199582';
    const metadata = JSON.stringify({
      name: "Juanito Perez",
      country: "MX",
      method: "spei",
      identifiers: {
        clabe: "012345678901234567",
        bank_name: "BBVA Bancomer",
        currency: "MXN"
      }
    });

    await client.query(`
      INSERT INTO beneficiaries (
        id, owner_id, metadata, created_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        NOW()
      )
    `, [owner_id, metadata]);
    
    console.log("Mock beneficiary (MXN) seeded successfully.");
  } catch (err) {
    console.error("DB error:", err.message);
  } finally {
    await client.end();
  }
}

seedBeneficiary();
