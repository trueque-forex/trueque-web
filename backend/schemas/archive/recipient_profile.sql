CREATE TABLE recipient_profiles (
  id SERIAL PRIMARY KEY,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  origin_country TEXT,
  origin_type TEXT,
  origin_details JSONB,
  recipient_name TEXT NOT NULL,
  relationship TEXT,
  destination_country TEXT,
  destination_type TEXT,
  destination_details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);