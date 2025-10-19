-- 20251017_0001_create_transactions_and_counters.sql
-- This migration delegates to the existing schema SQL files in backend/schemas.
-- Run with: psql "$DATABASE_URL" -f ./migrations/20251017_0001_create_transactions_and_counters.sql

BEGIN;

-- Include recipient profile DDL (assumes file contains CREATE TABLE/INDEX statements)
\echo 'Applying recipient_profile.sql'
\ir ../trueque-web/backend/schemas/recipient_profile.sql

-- Include transactions DDL (assumes file contains CREATE TABLE/INDEX statements)
\echo 'Applying transactions.sql'
\ir ../trueque-web/backend/schemas/transactions.sql

COMMIT;