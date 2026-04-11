
import { query } from '@/lib/server/db';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log('[DB PATCH] Starting schema patch...');

        // 1. Inspect current columns
        const { rows: cols } = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'beneficiaries'");
        console.log('[DB PATCH] Current Columns:', cols.map((c: any) => c.column_name).join(', '));

        // 2. Add 'metadata' if missing
        await query("ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS metadata JSONB;");
        console.log('[DB PATCH] Added metadata column.');

        // 3. Add 'name' if missing
        await query("ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS name VARCHAR(255);");
        console.log('[DB PATCH] Added name column.');

        // 4. Create Transactions Table
        await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL,
        status VARCHAR(50) DEFAULT 'DRAFT',
        amount_send DECIMAL(18,2),
        currency_from VARCHAR(3),
        amount_receive DECIMAL(18,2),
        currency_to VARCHAR(3),
        beneficiary_id BIGINT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
        console.log('[DB PATCH] Created transactions table.');

        // 5. Create Vouchers Table (Phase 1 — Closed-Loop)
        await query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL,
        retailer_id VARCHAR(50) NOT NULL,
        retailer_name VARCHAR(100) NOT NULL,
        voucher_code VARCHAR(100) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REDEEMED','EXPIRED','CANCELLED')),
        amount_usd DECIMAL(18,4) NOT NULL,
        amount_local DECIMAL(18,4) NOT NULL,
        local_currency VARCHAR(3) NOT NULL,
        exchange_rate DECIMAL(18,6) NOT NULL,
        processor_fee DECIMAL(18,4) NOT NULL DEFAULT 0,
        total_charged DECIMAL(18,4) NOT NULL,
        symmetri_fee DECIMAL(18,4) NOT NULL DEFAULT 0,
        rate_source VARCHAR(100),
        rate_fallback BOOLEAN DEFAULT false,
        payment_method VARCHAR(10) NOT NULL CHECK (payment_method IN ('ach','card')),
        beneficiary_name VARCHAR(200),
        beneficiary_phone VARCHAR(30),
        delivery_method VARCHAR(20) DEFAULT 'whatsapp',
        delivery_status VARCHAR(20) DEFAULT 'PENDING' CHECK (delivery_status IN ('PENDING','SENT','FAILED')),
        delivered_at TIMESTAMPTZ,
        redeemed_at TIMESTAMPTZ,
        redemption_store_id VARCHAR(100),
        historical_redemption_anchor JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
      );
    `);
        // Migrate existing 'user_id' column to 'owner_id' if it was created before standardization
        await query(`
            DO $$ BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'vouchers' AND column_name = 'user_id'
                ) THEN
                    ALTER TABLE vouchers RENAME COLUMN user_id TO owner_id;
                END IF;
            END $$;
        `);
        await query(`CREATE INDEX IF NOT EXISTS idx_vouchers_owner_id ON vouchers (owner_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers (status, retailer_id) WHERE status = 'REDEEMED'`);

        // Patch missing columns (idempotent — IF NOT EXISTS)
        await query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS historical_redemption_anchor JSONB`);
        await query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS redemption_store_id VARCHAR(100)`);
        await query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS symmetri_fee DECIMAL(18,4) NOT NULL DEFAULT 0`);
        await query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
        console.log('[DB PATCH] Ensured all vouchers columns present.');

        // 5. Verify
        const { rows: colsAfter } = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'beneficiaries'");

        res.status(200).json({
            success: true,
            columns_before: cols.map((c: any) => c.column_name),
            columns_after: colsAfter.map((c: any) => c.column_name)
        });
    } catch (error: any) {
        console.error('[DB PATCH] Error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
}
