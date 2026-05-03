
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
}

const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

const SCHEMA_SQL = `
-- 1. Create Beneficiaries Table
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Personal Info
  first_name text,
  last_name text,
  nickname text,
  email text,
  phone text,
  
  -- Banking Info
  bank_name text,
  account_number text,
  account_type text, -- e.g. 'checking', 'savings'
  currency text,     -- e.g. 'USD', 'MXN'
  
  -- Metadata
  relationship text,
  is_active boolean DEFAULT true
);

-- 2. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES public.users(id),
  
  amount numeric,
  currency text,
  status text DEFAULT 'PENDING',
  type text, 
  
  description text,
  beneficiary_id uuid REFERENCES public.beneficiaries(id)
);

-- 3. Enable Security (Open for Development)
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'beneficiaries' AND policyname = 'Enable all access for beneficiaries') THEN
        CREATE POLICY "Enable all access for beneficiaries" ON public.beneficiaries FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Enable all access for transactions') THEN
        CREATE POLICY "Enable all access for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
`;

async function deploy() {
    try {
        console.log('Deploying Schema...');
        await pool.query(SCHEMA_SQL);
        console.log('✅ Schema Deployed Successfully');
    } catch (err) {
        console.error('❌ Deployment Failed:', err.message);
    } finally {
        await pool.end();
    }
}

deploy();
