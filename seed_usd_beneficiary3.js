const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function seedBeneficiary() {
  try {
    await client.connect();
    
    // Seed a USD beneficiary for mx_test
    const query = `
      INSERT INTO recipient_profiles (
        owner_id,
        recipient_name,
        destination_country,
        destination_details,
        destination_type,
        sender_name,
        sender_email,
        relationship,
        origin_country,
        origin_type,
        origin_details
      ) VALUES (
        '9613090e-556d-4d15-8304-7ec99c8e8055',
        'Alice Smith',
        'US',
        '{"currency": "USD", "bank_name": "Chase", "account_number": "123456789", "routing_number": "000000000", "deliveryMethod": "bank_rtp"}',
        'bank_account',
        'MX Test',
        'mx_test@symmetri.dev',
        'friend',
        'MX',
        'individual',
        '{}'
      )
      RETURNING *;
    `;
    
    const result = await client.query(query);
    console.log("Seeded USD Beneficiary:", result.rows);
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    await client.end();
  }
}
seedBeneficiary();
