require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
CREATE TABLE IF NOT EXISTS vouchers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    user_id             UUID NOT NULL,
    amount_usd          NUMERIC(20, 4) NOT NULL,
    amount_local        NUMERIC(20, 4) NOT NULL,
    local_currency      VARCHAR(3)    NOT NULL,
    exchange_rate       NUMERIC(20, 8) NOT NULL,
    processor_fee       NUMERIC(20, 4) NOT NULL DEFAULT 0,
    total_charged       NUMERIC(20, 4) NOT NULL,
    retailer_id         VARCHAR(50)   NOT NULL,
    retailer_name       VARCHAR(255)  NOT NULL,
    voucher_code        VARCHAR(64)   UNIQUE NOT NULL,
    payment_method      VARCHAR(20)   NOT NULL,
    status              VARCHAR(30)   NOT NULL DEFAULT 'PENDING_PAYMENT',
    redeemed_at         TIMESTAMPTZ,
    redeemed_by_phone   VARCHAR(50),
    rate_source         VARCHAR(50),
    rate_fallback       BOOLEAN       DEFAULT FALSE,
    ip_country          VARCHAR(2)
);
CREATE INDEX IF NOT EXISTS vouchers_user_id_idx ON vouchers(user_id);
CREATE INDEX IF NOT EXISTS vouchers_code_idx    ON vouchers(voucher_code);
`;

pool.query(sql)
    .then(() => {
        console.log('SUCCESS: vouchers table created (or already exists)');
        pool.end();
    })
    .catch(err => {
        console.error('ERROR:', err.message);
        pool.end();
        process.exit(1);
    });
