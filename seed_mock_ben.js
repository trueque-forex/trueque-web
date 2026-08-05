const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function seedBeneficiary() {
  try {
    await client.connect();
    
    const owner_id = 'ea5eeb4a-0ce9-4484-9a23-310888199582';
    const metadata = JSON.stringify({
      name: "Lionel Messi",
      country: "ES",
      method: "sepa_instant",
      identifiers: {
        iban: "ES12345678901234567890",
        swift: "BANCES11XXX"
      }
    });

    await client.query(`
      INSERT INTO beneficiaries (
        id, owner_id, metadata, first_name, last_name, bank_name, currency, created_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        'Lionel',
        'Messi',
        'Banco Santander (ES)',
        'EUR',
        NOW()
      )
    `, [owner_id, metadata]);
    
    console.log("Mock beneficiary (Argentinian in Spain) seeded successfully.");
  } catch (err) {
    console.error("DB error:", err.message);
  } finally {
    await client.end();
  }
}

seedBeneficiary();
