-- Migration to add kyc_status to users table
-- This allows the signup API to proceed if the column is missing.

BEGIN;

DO $$
BEGIN
    -- kyc_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='kyc_status') THEN
        ALTER TABLE users ADD COLUMN kyc_status TEXT DEFAULT 'INCOMPLETE';
    END IF;

    -- city
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='city') THEN
        ALTER TABLE users ADD COLUMN city TEXT;
    END IF;

    -- state
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='state') THEN
        ALTER TABLE users ADD COLUMN state TEXT;
    END IF;

    -- postal_code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='postal_code') THEN
        ALTER TABLE users ADD COLUMN postal_code TEXT;
    END IF;

    -- street_address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='street_address') THEN
        ALTER TABLE users ADD COLUMN street_address TEXT;
    END IF;

    -- apartment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='apartment') THEN
        ALTER TABLE users ADD COLUMN apartment TEXT;
    END IF;

    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;

    RAISE NOTICE 'Migration alignment for users table complete.';
END $$;

COMMIT;
