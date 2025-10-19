-- migrations/20251017_0001_create_recipient_profiles_and_transactions.sql
-- Creates recipient_profiles, transactions, and transaction_counters (daily sequence)
-- Run with: psql "$DATABASE_URL" -f ./migrations/20251017_0001_create_recipient_profiles_and_transactions.sql

BEGIN;

-- recipient_profiles
CREATE TABLE IF NOT EXISTS recipient_profiles (
  id              SERIAL PRIMARY KEY,
  sender_name     TEXT NOT NULL,
  sender_email    TEXT NOT NULL,
  origin_country  TEXT,
  origin_type     TEXT,
  origin_details  JSONB,
  recipient_name  TEXT NOT NULL,
  relationship    TEXT,
  destination_country TEXT,
  destination_type TEXT,
  destination_details JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipient_profiles_sender_email ON recipient_profiles (sender_email);

-- transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id                BIGSERIAL PRIMARY KEY,
  transaction_id    VARCHAR(64) NOT NULL UNIQUE,
  user_id           VARCHAR(128) NOT NULL,
  from_country      VARCHAR(8),
  to_country        VARCHAR(8),
  amount            NUMERIC(20,6),
  fee_platform      NUMERIC(20,6),
  fee_transmitter   NUMERIC(20,6),
  receive_amount    NUMERIC(20,6),
  quote_payload     JSONB,
  payload           JSONB,
  status            VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  idempotency_key   VARCHAR(128),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_idempotency_key ON transactions (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions (transaction_id);

-- daily counter table for allocating per-day sequence numbers atomically
CREATE TABLE IF NOT EXISTS transaction_counters (
  day      TEXT PRIMARY KEY,        -- 'YYYYMMDD' in UTC
  last_seq BIGINT NOT NULL
);

-- safety constraint for status values (will error if constraint already exists in some DBs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'chk_transactions_status_valid' AND t.relname = 'transactions'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT chk_transactions_status_valid CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED'));
  END IF;
END;
$$;

COMMIT;