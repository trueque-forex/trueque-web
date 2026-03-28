
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
