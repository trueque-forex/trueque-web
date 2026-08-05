const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function seedBeneficiariesTable() {
  try {
    await client.connect();
    
    // Find mx_test's actual ID
    const res = await client.query(`SELECT id FROM public.users WHERE email='mx_test@symmetri.dev'`);
    if (res.rows.length === 0) {
      console.log("No mx_test user found!");
      return;
    }
    const realId = res.rows[0].id;
    console.log("Real mx_test ID:", realId);
    
    // Insert into beneficiaries
    const metadata = {
      name: "Alice Smith",
      method: "bank_rtp",
      identifiers: {
        bankName: "Chase",
        routingNumber: "000000000",
        accountNumber: "123456789",
        accountType: "checking"
      },
      country: "US"
    };

    const query = `
      INSERT INTO beneficiaries (owner_id, metadata, created_at)
      VALUES ($1, $2, NOW())
      RETURNING *;
    `;
    const upRes = await client.query(query, [realId, JSON.stringify(metadata)]);
    console.log("Inserted Beneficiary:", upRes.rows);
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    await client.end();
  }
}
seedBeneficiariesTable();
