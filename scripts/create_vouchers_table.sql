-- Run this in Supabase SQL Editor to create the vouchers table
-- Phase 1: Closed-loop voucher issuance at mid-market rate, zero Symmetri fees

CREATE TABLE IF NOT EXISTS vouchers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

    -- Buyer
    user_id             UUID NOT NULL,

    -- Economics — always at mid-market rate, zero Symmetri fee
    amount_usd          NUMERIC(20, 4) NOT NULL,   -- what buyer pays
    amount_local        NUMERIC(20, 4) NOT NULL,   -- what beneficiary receives
    local_currency      VARCHAR(3)    NOT NULL,    -- e.g. MXN
    exchange_rate       NUMERIC(20, 8) NOT NULL,   -- mid-market rate at time of purchase
    processor_fee       NUMERIC(20, 4) NOT NULL DEFAULT 0, -- card processor fee only (if applicable)
    total_charged       NUMERIC(20, 4) NOT NULL,   -- amount_usd + processor_fee

    -- Retailer
    retailer_id         VARCHAR(50)   NOT NULL,
    retailer_name       VARCHAR(255)  NOT NULL,

    -- Voucher itself
    voucher_code        VARCHAR(64)   UNIQUE NOT NULL,
    payment_method      VARCHAR(20)   NOT NULL,  -- 'ach' | 'card'
    status              VARCHAR(30)   NOT NULL DEFAULT 'PENDING_PAYMENT',
    -- PENDING_PAYMENT → ACTIVE → REDEEMED | EXPIRED

    redeemed_at         TIMESTAMPTZ,
    redeemed_by_phone   VARCHAR(50),   -- beneficiary phone (only on redemption, PII)

    -- Audit
    rate_source         VARCHAR(50),
    rate_fallback       BOOLEAN       DEFAULT FALSE,
    ip_country          VARCHAR(2)
);

-- Index for fast lookup by user and code
CREATE INDEX IF NOT EXISTS vouchers_user_id_idx ON vouchers(user_id);
CREATE INDEX IF NOT EXISTS vouchers_code_idx    ON vouchers(voucher_code);
