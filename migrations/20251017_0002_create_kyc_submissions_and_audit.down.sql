-- 20251017_0002_create_kyc_submissions_and_audit.down.sql
BEGIN;

-- Drop trigger and function
DROP TRIGGER IF EXISTS trg_kyc_submissions_upsert_status ON kyc_submissions;
DROP FUNCTION IF EXISTS kyc_upsert_user_status();

-- Drop helper id function
DROP FUNCTION IF EXISTS gen_kyc_submission_id();

-- Drop tables (cascade will remove indexes, constraints)
DROP TABLE IF EXISTS user_kyc_status CASCADE;
DROP TABLE IF EXISTS kyc_audit_logs CASCADE;
DROP TABLE IF EXISTS kyc_files CASCADE;
DROP TABLE IF EXISTS kyc_submissions CASCADE;

-- Drop enums
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
    DROP TYPE kyc_status;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_tier') THEN
    DROP TYPE kyc_tier;
  END IF;
END$$;

COMMIT;