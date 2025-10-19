-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER KYC STATUS (1:1 with users)
CREATE TABLE IF NOT EXISTS user_kyc_status (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT,
  status TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- KYC SUBMISSIONS (1:N per user)
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- KYC FILES (1:N per submission)
CREATE TABLE IF NOT EXISTS kyc_files (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES kyc_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL, -- e.g. 'id', 'selfie', 'proof_of_address'
  storage_path TEXT NOT NULL,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- KYC AUDIT LOGS (N per user, optional submission)
CREATE TABLE IF NOT EXISTS kyc_audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES kyc_submissions(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g. 'file_uploaded', 'appeal_submitted'
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional indexes for performance
CREATE INDEX IF NOT EXISTS idx_kyc_files_user ON kyc_files(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_files_submission ON kyc_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_kyc_audit_user ON kyc_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_audit_submission ON kyc_audit_logs(submission_id);