BEGIN;

-- Create users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'users' AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- Optional: create supporting enums or roles if needed
-- DO $$ BEGIN ... END $$;

COMMIT;