const { Client } = require('pg');
(async () => {
  const pool = new Client({ connectionString: "postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres" });
  await pool.connect();
  const meta = JSON.stringify({
    name: "Mexican Bank",
    country: "MX",
    type: "bank",
    identifiers: { currency: "MXN", bank_name: "BBVA" }
  });
  await pool.query(`INSERT INTO beneficiaries (owner_id, metadata, created_at) VALUES ('9613090e-556d-4d15-8304-7ec99c8e8055', $1, NOW())`, [meta]);
  console.log("Done");
  await pool.end();
})();
