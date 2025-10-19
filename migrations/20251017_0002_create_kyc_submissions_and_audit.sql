-- 20251017_0002_create_kyc_submissions_and_audit.sql
-- Postgres migration (up / down). Designed for idempotent application in a transactional migration runner.

BEGIN;

-- 1) kyc_tier enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_tier') THEN
    CREATE TYPE kyc_tier AS ENUM ('none', 'low', 'medium', 'high');
  END IF;
END$$;

-- 2) kyc_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
    CREATE TYPE kyc_status AS ENUM ('not_submitted', 'pending', 'under_review', 'verified', 'flagged', 'rejected');
  END IF;
END$$;

-- 3) kyc_submissions table
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id TEXT PRIMARY KEY,                             -- e.g., sub_XXXXXXXX
  user_id UUID NOT NULL,                           -- references users.id (optional FK below)
  submission_type TEXT NOT NULL DEFAULT 'initial', -- 'initial' | 'retry' | 'supplement'
  payload JSONB NOT NULL DEFAULT '{}' ,            -- normalized form fields, sanitized
  file_refs JSONB NOT NULL DEFAULT '{}' ,          -- map of logical name -> storage key (S3/GCS) or null
  provider_job_id TEXT,                            -- id from 3rd-party verifier (if any)
  status kyc_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,           -- when worker finished (success/fail)
  notes TEXT                                       -- operator notes, short text
);

-- Optional FK to users table if present
ALTER TABLE kyc_submissions
  ADD CONSTRAINT fk_kyc_submissions_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON kyc_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions (status);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_created_at ON kyc_submissions (created_at);

-- 4) kyc_files table (denormalized references for audit/search)
CREATE TABLE IF NOT EXISTS kyc_files (
  id TEXT PRIMARY KEY,          -- e.g., file_XXXXXXXX
  submission_id TEXT NOT NULL,  -- references kyc_submissions.id
  logical_name TEXT NOT NULL,   -- e.g., id_front, id_back, selfie, proof_of_address
  storage_key TEXT NOT NULL,    -- e.g., s3://bucket/key or object key
  content_type TEXT,
  size_bytes BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE kyc_files
  ADD CONSTRAINT fk_kyc_files_submission
  FOREIGN KEY (submission_id) REFERENCES kyc_submissions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kyc_files_submission_id ON kyc_files (submission_id);
CREATE INDEX IF NOT EXISTS idx_kyc_files_logical_name ON kyc_files (logical_name);

-- 5) kyc_audit_logs table (immutable event log)
CREATE TABLE IF NOT EXISTS kyc_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  submission_id TEXT,                 -- nullable for cross-user events
  user_id UUID,                       -- operator or system actor (nullable for system)
  event_type TEXT NOT NULL,           -- e.g., submitted, file_uploaded, queued, provider_sent, provider_callback, verified, rejected, manual_override
  payload JSONB DEFAULT '{}' ,        -- structured event metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kyc_audit_submission_id ON kyc_audit_logs (submission_id);
CREATE INDEX IF NOT EXISTS idx_kyc_audit_user_id ON kyc_audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_audit_event_type ON kyc_audit_logs (event_type);

-- 6) user_kyc_status materialized/per-user view table (fast read)
CREATE TABLE IF NOT EXISTS user_kyc_status (
  user_id UUID PRIMARY KEY,
  kyc_tier kyc_tier NOT NULL DEFAULT 'none',
  kyc_status kyc_status NOT NULL DEFAULT 'not_submitted',
  last_submission_id TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_kyc_status_tier ON user_kyc_status (kyc_tier);

-- Trigger to keep user_kyc_status in sync on submission insertion/update
CREATE OR REPLACE FUNCTION kyc_upsert_user_status() RETURNS TRIGGER AS $$
BEGIN
  -- Upsert user_kyc_status row for this submission
  INSERT INTO user_kyc_status (user_id, kyc_tier, kyc_status, last_submission_id, last_updated)
    VALUES (NEW.user_id, 'low', NEW.status, NEW.id, now())
  ON CONFLICT (user_id) DO UPDATE
    SET kyc_status = EXCLUDED.kyc_status,
        last_submission_id = EXCLUDED.last_submission_id,
        last_updated = EXCLUDED.last_updated;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_kyc_submissions_upsert_status ON kyc_submissions;
CREATE TRIGGER trg_kyc_submissions_upsert_status
  AFTER INSERT OR UPDATE ON kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION kyc_upsert_user_status();

-- 7) function to generate deterministic ids (optional helper)
CREATE OR REPLACE FUNCTION gen_kyc_submission_id() RETURNS TEXT AS $$
BEGIN
  RETURN 'sub_' || to_char(now(), 'YYYYMMDDHH24MISS') || '_' || substr(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

-- 8) ensure permissions for a dedicated service role (example, adjust to your role names)
-- GRANT usage/select/insert on tables to service roles as needed (commented; adapt to your environment)
-- GRANT SELECT, INSERT, UPDATE ON kyc_submissions TO app_service;
-- GRANT SELECT, INSERT ON kyc_files TO app_service;
-- GRANT SELECT, INSERT ON kyc_audit_logs TO app_service;
-- GRANT SELECT, INSERT, UPDATE ON user_kyc_status TO app_service;

COMMIT;