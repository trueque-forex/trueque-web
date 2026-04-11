BEGIN;

DO $$
BEGIN
    -- Add username if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
        ALTER TABLE users ADD COLUMN username TEXT;
    END IF;

    -- Add username_canonical if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username_canonical') THEN
        ALTER TABLE users ADD COLUMN username_canonical TEXT;
    END IF;

    -- Add email if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email') THEN
        ALTER TABLE users ADD COLUMN email TEXT;
    END IF;

    -- Add email_canonical if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_canonical') THEN
        ALTER TABLE users ADD COLUMN email_canonical TEXT;
    END IF;

    -- Add password_hash if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
    END IF;

    -- Add first_name if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='first_name') THEN
        ALTER TABLE users ADD COLUMN first_name TEXT;
    END IF;

    -- Add last_name if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_name') THEN
        ALTER TABLE users ADD COLUMN last_name TEXT;
    END IF;

    -- Add dob if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='dob') THEN
        ALTER TABLE users ADD COLUMN dob DATE;
    END IF;

    -- Add country_of_residence if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='country_of_residence') THEN
        ALTER TABLE users ADD COLUMN country_of_residence TEXT;
    END IF;

    -- Add country_destiny if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='country_destiny') THEN
        ALTER TABLE users ADD COLUMN country_destiny TEXT;
    END IF;

    -- Add address if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='address') THEN
        ALTER TABLE users ADD COLUMN address TEXT;
    END IF;

    -- Add is_test if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_test') THEN
        ALTER TABLE users ADD COLUMN is_test BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add tid if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tid') THEN
        ALTER TABLE users ADD COLUMN tid TEXT;
    END IF;
    
    -- Add created_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;

END $$;

COMMIT;
