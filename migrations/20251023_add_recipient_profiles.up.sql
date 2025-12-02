CREATE TABLE recipient_profiles (
  id SERIAL PRIMARY KEY,
  sender_name TEXT,
  sender_email TEXT,
  origin_country TEXT,
  origin_type TEXT,
  origin_details JSON,
  recipient_name TEXT,
  relationship TEXT,
  destination_country TEXT,
  destination_type TEXT,
  destination_details JSON,
  created_at TIMESTAMP DEFAULT NOW()
);